const db = require('../config/db');

/**
 * Creates a student submission. Auto-grades multiple choice questions,
 * saves the submission & individual question answers inside a transaction.
 */
const submitExam = async (req, res, next) => {
  const { examId, answers } = req.body;
  const studentId = req.user ? req.user.id : req.body.studentId;

  if (!examId || !answers) {
    return res.status(400).json({ error: 'examId and answers are required.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch exam details and questions
    const examResult = await client.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam not found.' });
    }
    const exam = examResult.rows[0];

    const questionsResult = await client.query('SELECT * FROM questions WHERE exam_id = $1', [examId]);
    const questions = questionsResult.rows;

    // 2. Resolve student user ID
    let resolvedStudentId = studentId;
    if (!resolvedStudentId && req.body.studentName) {
      const studentLookup = await client.query(
        "SELECT id FROM users WHERE name = $1 AND role = 'student'",
        [req.body.studentName]
      );
      if (studentLookup.rows.length > 0) {
        resolvedStudentId = studentLookup.rows[0].id;
      }
    }

    if (!resolvedStudentId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'studentId could not be determined.' });
    }

    // 3. Ensure student is enrolled in the exam's course
    if (exam.course_id) {
      const enrollmentCheck = await client.query(
        'SELECT * FROM user_courses WHERE student_id = $1 AND course_id = $2',
        [resolvedStudentId, exam.course_id]
      );
      if (enrollmentCheck.rows.length === 0) {
        await client.query(
          'INSERT INTO user_courses (student_id, course_id) VALUES ($1, $2)',
          [resolvedStudentId, exam.course_id]
        );
      }
    }

    // 4. Auto grade multiple choice questions
    let totalScore = 0;
    questions.forEach(q => {
      // Map correct_answers to correctAnswers to satisfy "compare student's answer array to q.correctAnswers"
      q.correctAnswers = q.correct_answers;

      if (q.type === 'multiple_choice') {
        const given = answers[q.id]; // key is question ID
        const expected = q.correctAnswers;

        if (Array.isArray(expected) && Array.isArray(given)) {
          const isCorrect = expected.length === given.length && 
                            expected.every(val => given.includes(val));
          if (isCorrect) {
            totalScore += q.points;
          }
        }
      }
    });

    const finalScore = Math.round(totalScore);

    // 5. Insert submission record
    const submissionResult = await client.query(`
      INSERT INTO submissions (exam_id, student_id, score, status, submitted_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id, score, submitted_at
    `, [examId, resolvedStudentId, finalScore, 'submitted']);

    const newSubId = submissionResult.rows[0].id;

    // 6. Insert individual question answers
    for (const q of questions) {
      const val = answers[q.id];
      let selectedOptions = null;
      let textResponse = null;

      if (Array.isArray(val)) {
        selectedOptions = val;
      } else if (typeof val === 'string') {
        textResponse = val;
      }

      await client.query(`
        INSERT INTO answers (submission_id, question_id, selected_options, text_response)
        VALUES ($1, $2, $3, $4)
      `, [newSubId, q.id, selectedOptions, textResponse]);
    }

    await client.query('COMMIT');

    // Return the final submission object
    const finalSubResult = await db.query(`
      SELECT s.*, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = $1
    `, [newSubId]);

    const formatted = await formatSubmission(finalSubResult.rows[0]);
    res.status(201).json(formatted);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Formats a raw database submission row and its associated answers
 * into the structured nested object expected by the React client.
 */
const formatSubmission = async (subRow) => {
  const answersResult = await db.query(
    'SELECT * FROM answers WHERE submission_id = $1',
    [subRow.id]
  );
  
  const answersMap = {};
  const manualGrades = {};
  const teacherNotes = {};

  answersResult.rows.forEach(ans => {
    // Determine answer value type (array or string)
    const val = ans.selected_options !== null ? ans.selected_options : ans.text_response;
    answersMap[ans.question_id] = val;

    if (ans.manual_points !== null) {
      manualGrades[ans.question_id] = ans.manual_points;
    }
    if (ans.notes !== null) {
      teacherNotes[ans.question_id] = ans.notes;
    }
  });

  return {
    id: subRow.id,
    studentName: subRow.student_name,
    studentId: subRow.student_id,
    examId: subRow.exam_id,
    score: subRow.score,
    status: subRow.status,
    answers: answersMap,
    manualGrades,
    teacherNotes,
    submittedAt: subRow.submitted_at
  };
};

/**
 * Retrieves submissions for a student by student name.
 */
const getMySubmissions = async (req, res, next) => {
  const studentId = req.user ? req.user.id : null;

  if (!studentId) {
    return res.status(401).json({ error: 'Unauthorized: Student ID not found in session.' });
  }

  try {
    const result = await db.query(`
      SELECT s.id as "submissionId", s.exam_id as "examId", s.score, s.submitted_at as "submittedAt",
             e.title, e.pass_grade as "passGrade", e.are_grades_published as "areGradesPublished"
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC
    `, [studentId]);

    // Map areGradesPublished to resolve true by default (as in mockDb fallback)
    const formatted = result.rows.map(r => ({
      examId: r.examId,
      title: r.title || 'Unknown Exam',
      score: r.score,
      passGrade: r.passGrade || 50,
      areGradesPublished: r.areGradesPublished !== false,
      submittedAt: r.submittedAt
    }));

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves all submissions associated with an exam.
 */
const getExamSubmissions = async (req, res, next) => {
  const { examId } = req.params;

  try {
    const result = await db.query(`
      SELECT s.*, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.exam_id = $1
      ORDER BY s.submitted_at DESC
    `, [examId]);

    const formatted = [];
    for (const row of result.rows) {
      formatted.push(await formatSubmission(row));
    }

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves a student's submission for a specific exam.
 */
const getStudentExamSubmission = async (req, res, next) => {
  const { examId, studentName } = req.params;

  try {
    // Resolve student ID
    const studentCheck = await db.query(
      "SELECT id FROM users WHERE name = $1 AND role = 'student'",
      [studentName]
    );
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    const studentId = studentCheck.rows[0].id;

    const result = await db.query(`
      SELECT s.*, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.exam_id = $1 AND s.student_id = $2
    `, [examId, studentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const formatted = await formatSubmission(result.rows[0]);
    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves details of a single submission by ID.
 */
const getSubmissionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT s.*, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const formatted = await formatSubmission(result.rows[0]);
    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * Manually updates a question grade in a submission and recalculates the final score.
 */
const updateManualGrade = async (req, res, next) => {
  const { id } = req.params;
  const { questionId, points, notes } = req.body;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check if submission exists
    const subCheck = await client.query('SELECT * FROM submissions WHERE id = $1', [id]);
    if (subCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Submission not found.' });
    }
    const sub = subCheck.rows[0];

    // 2. Update the answer points and notes
    await client.query(`
      UPDATE answers 
      SET manual_points = $1, notes = $2 
      WHERE submission_id = $3 AND question_id = $4
    `, [Number(points), notes || '', id, questionId]);

    // 3. Retrieve all questions and student answers to recalculate the score
    const questionsResult = await client.query('SELECT * FROM questions WHERE exam_id = $1', [sub.exam_id]);
    const questions = questionsResult.rows;

    const answersResult = await client.query('SELECT * FROM answers WHERE submission_id = $1', [id]);
    const answers = answersResult.rows;

    // Create lookups
    const answersMap = {};
    const manualGrades = {};

    answers.forEach(ans => {
      answersMap[ans.question_id] = ans.selected_options !== null ? ans.selected_options : ans.text_response;
      if (ans.manual_points !== null) {
        manualGrades[ans.question_id] = ans.manual_points;
      }
    });

    let totalScore = 0;
    questions.forEach(q => {
      // If manually graded, use manual points
      if (manualGrades[q.id] !== undefined) {
        totalScore += manualGrades[q.id];
      } else if (q.type === 'multiple_choice') {
        const expected = q.correct_answers;
        const given = answersMap[q.id];
        if (Array.isArray(expected) && Array.isArray(given)) {
          const isCorrect = expected.length === given.length && 
                            expected.every(val => given.includes(val));
          if (isCorrect) {
            totalScore += q.points;
          }
        }
      }
    });

    const finalScore = Math.round(totalScore);

    // 4. Update the submission total score and status to 'graded' if it contains manual grades
    // (A standard approach is status 'graded' since a teacher manually evaluated it)
    await client.query(
      'UPDATE submissions SET score = $1, status = $2 WHERE id = $3',
      [finalScore, 'graded', id]
    );

    await client.query('COMMIT');

    // 5. Return updated submission object
    const updatedSubResult = await db.query(`
      SELECT s.*, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = $1
    `, [id]);
    
    const formatted = await formatSubmission(updatedSubResult.rows[0]);
    res.status(200).json(formatted);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = {
  submitExam,
  getMySubmissions,
  getExamSubmissions,
  getStudentExamSubmission,
  getSubmissionById,
  updateManualGrade
};
