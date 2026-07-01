const db = require('../config/db');

/**
 * Retrieves all exams from the database, including their nested questions and options.
 */
const getAllExams = async (req, res, next) => {
  const { teacherId } = req.query;

  try {
    let examsResult;

    if (teacherId) {
      const tId = parseInt(teacherId, 10);
      if (isNaN(tId)) {
        return res.status(400).json({ error: 'Invalid teacher ID.' });
      }
      // Fetch exams + submission counts in one query using LEFT JOIN
      examsResult = await db.query(`
        SELECT e.*, COALESCE(s.submission_count, 0) AS submission_count
        FROM exams e
        LEFT JOIN (
          SELECT exam_id, COUNT(*) AS submission_count
          FROM submissions
          GROUP BY exam_id
        ) s ON s.exam_id = e.id
        WHERE e.creator_id = $1
        ORDER BY e.id ASC
      `, [tId]);
    } else {
      examsResult = await db.query('SELECT * FROM exams ORDER BY id ASC');
    }

    const exams = examsResult.rows;
    if (exams.length === 0) {
      return res.status(200).json([]);
    }

    const examIds = exams.map(e => e.id);

    // Fetch questions only for these exams
    const questionsResult = await db.query(
      'SELECT * FROM questions WHERE exam_id = ANY($1) ORDER BY id ASC',
      [examIds]
    );
    const questions = questionsResult.rows;

    // Fetch options only for these questions
    let options = [];
    if (questions.length > 0) {
      const qIds = questions.map(q => q.id);
      const optionsResult = await db.query(
        'SELECT * FROM options WHERE question_id = ANY($1) ORDER BY id ASC',
        [qIds]
      );
      options = optionsResult.rows;
    }

    // Map options by their question_id
    const optionsMap = {};
    options.forEach(opt => {
      if (!optionsMap[opt.question_id]) {
        optionsMap[opt.question_id] = [];
      }
      optionsMap[opt.question_id].push(opt.text);
    });

    // Map options back to their questions and handle naming conventions
    questions.forEach(q => {
      q.options = optionsMap[q.id] || [];
      q.allowMultipleAnswers = q.allow_multiple_answers;
      delete q.allow_multiple_answers;
      q.correctAnswers = q.correct_answers;
      delete q.correct_answers;
    });

    // Group questions by their exam_id
    const questionsMap = {};
    questions.forEach(q => {
      if (!questionsMap[q.exam_id]) {
        questionsMap[q.exam_id] = [];
      }
      questionsMap[q.exam_id].push(q);
    });

    const isStudent = req.user && req.user.role === 'student';

    // Build the final response objects
    const formattedExams = exams.map(e => {
      const examQuestions = questionsMap[e.id] || [];

      // Student security filter: Exclude correctAnswers if grades are not published
      const hideCorrectAnswers = isStudent && !e.are_grades_published;
      const questionsForUser = examQuestions.map(q => {
        const qCopy = { ...q };
        if (hideCorrectAnswers) {
          delete qCopy.correctAnswers;
        }
        return qCopy;
      });

      return {
        id: e.id,
        title: e.title,
        courseId: e.course_id,
        startDate: e.start_date,
        endDate: e.end_date,
        areGradesPublished: e.are_grades_published,
        factor: e.factor,
        duration: e.duration,
        passGrade: e.pass_grade,
        creatorId: e.creator_id,
        submissionCount: e.submission_count !== undefined ? parseInt(e.submission_count, 10) : undefined,
        questions: questionsForUser
      };
    });

    res.status(200).json(formattedExams);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves a single exam with nested questions and options by ID.
 * Excludes correctAnswers if user is a student.
 */
const getExamById = async (req, res, next) => {
  const { id } = req.params;
  const examId = parseInt(id, 10);
  if (isNaN(examId)) {
    return res.status(400).json({ error: 'Invalid exam ID.' });
  }

  try {
    const examResult = await db.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    
    const e = examResult.rows[0];

    // Fetch questions
    const questionsResult = await db.query('SELECT * FROM questions WHERE exam_id = $1 ORDER BY id ASC', [examId]);
    const questions = questionsResult.rows;

    if (questions.length > 0) {
      const qIds = questions.map(q => q.id);
      const optionsResult = await db.query(
        'SELECT * FROM options WHERE question_id = ANY($1) ORDER BY id ASC',
        [qIds]
      );
      const options = optionsResult.rows;

      const optionsMap = {};
      options.forEach(opt => {
        if (!optionsMap[opt.question_id]) {
          optionsMap[opt.question_id] = [];
        }
        optionsMap[opt.question_id].push(opt.text);
      });

      const isStudent = req.user && req.user.role === 'student';
      const hideCorrectAnswers = isStudent && !e.are_grades_published;

      questions.forEach(q => {
        q.options = optionsMap[q.id] || [];
        q.allowMultipleAnswers = q.allow_multiple_answers;
        delete q.allow_multiple_answers;
        q.correctAnswers = q.correct_answers;
        delete q.correct_answers;

        if (hideCorrectAnswers) {
          delete q.correctAnswers;
        }
      });
    }

    res.status(200).json({
      id: e.id,
      title: e.title,
      courseId: e.course_id,
      startDate: e.start_date,
      endDate: e.end_date,
      areGradesPublished: e.are_grades_published,
      factor: e.factor,
      duration: e.duration,
      passGrade: e.pass_grade,
      creatorId: e.creator_id,
      questions
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Creates a new exam and seeds questions and options inside a transaction.
 */
const createExam = async (req, res, next) => {
  const { title, courseId, duration, passGrade, startDate, endDate, areGradesPublished, questions } = req.body;
  const creatorId = req.user.id;

  const examDuration = duration !== undefined ? Number(duration) : 60;
  const examPassGrade = passGrade !== undefined ? Number(passGrade) : 50;

  if (isNaN(examDuration) || examDuration <= 0) {
    return res.status(400).json({ error: 'Duration must be a positive number greater than 0.' });
  }

  if (isNaN(examPassGrade) || examPassGrade <= 0 || examPassGrade > 100) {
    return res.status(400).json({ error: 'Pass grade must be between 1 and 100.' });
  }

  const cId = parseInt(courseId, 10);
  if (isNaN(cId)) {
    return res.status(400).json({ error: 'Invalid course ID.' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Exam title is required and cannot be empty.' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Exam must have at least one question.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const examResult = await client.query(`
      INSERT INTO exams (title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, creator_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, factor, creator_id
    `, [title.trim(), cId, examDuration, examPassGrade, startDate, endDate, areGradesPublished || false, creatorId]);

    const newExam = examResult.rows[0];
    const newQuestions = [];

    if (Array.isArray(questions)) {
      for (const q of questions) {
        const questionResult = await client.query(`
          INSERT INTO questions (exam_id, text, type, points, allow_multiple_answers, correct_answers)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, text, type, points, allow_multiple_answers, correct_answers
        `, [
          newExam.id,
          q.text,
          q.type,
          q.points || 0,
          q.allowMultipleAnswers || false,
          q.correctAnswers || []
        ]);

        const newQuestion = questionResult.rows[0];
        newQuestion.options = [];

        newQuestion.allowMultipleAnswers = newQuestion.allow_multiple_answers;
        delete newQuestion.allow_multiple_answers;
        newQuestion.correctAnswers = newQuestion.correct_answers;
        delete newQuestion.correct_answers;

        if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
          for (const optText of q.options) {
            const optionResult = await client.query(`
              INSERT INTO options (question_id, text)
              VALUES ($1, $2)
              RETURNING text
            `, [newQuestion.id, optText]);
            newQuestion.options.push(optionResult.rows[0].text);
          }
        }

        newQuestions.push(newQuestion);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: newExam.id,
      title: newExam.title,
      courseId: newExam.course_id,
      duration: newExam.duration,
      passGrade: newExam.pass_grade,
      startDate: newExam.start_date,
      endDate: newExam.end_date,
      areGradesPublished: newExam.are_grades_published,
      factor: newExam.factor,
      creatorId: newExam.creator_id,
      questions: newQuestions
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const areQuestionsIdentical = async (sentQuestions, dbQuestions) => {
  if (sentQuestions.length !== dbQuestions.length) return false;

  for (let i = 0; i < sentQuestions.length; i++) {
    const sq = sentQuestions[i];
    const dq = dbQuestions[i];

    if (sq.text !== dq.text) return false;
    if (sq.type !== dq.type) return false;
    if (Number(sq.points) !== Number(dq.points)) return false;
    
    const sqAllow = sq.allowMultipleAnswers || false;
    const dqAllow = dq.allow_multiple_answers || false;
    if (sqAllow !== dqAllow) return false;

    // Compare correctAnswers arrays
    const sqCorrect = Array.isArray(sq.correctAnswers) ? sq.correctAnswers : [];
    const dqCorrect = Array.isArray(dq.correct_answers) ? dq.correct_answers : [];
    if (sqCorrect.length !== dqCorrect.length) return false;
    const sqCorrectSorted = [...sqCorrect].sort();
    const dqCorrectSorted = [...dqCorrect].sort();
    if (!sqCorrectSorted.every((val, index) => val === dqCorrectSorted[index])) return false;

    // Compare options if multiple choice
    if (sq.type === 'multiple_choice') {
      const dqOptionsResult = await db.query('SELECT * FROM options WHERE question_id = $1 ORDER BY id ASC', [dq.id]);
      const dqOptions = dqOptionsResult.rows.map(o => o.text);
      const sqOptions = Array.isArray(sq.options) ? sq.options : [];
      
      if (sqOptions.length !== dqOptions.length) return false;
      if (!sqOptions.every((val, index) => val === dqOptions[index])) return false;
    }
  }

  return true;
};

/**
 * Updates an existing exam.
 */
const updateExam = async (req, res, next) => {
  const { id } = req.params;
  const { title, courseId, duration, passGrade, startDate, endDate, areGradesPublished, questions } = req.body;

  const examId = parseInt(id, 10);
  if (isNaN(examId)) {
    return res.status(400).json({ error: 'Invalid exam ID.' });
  }

  const cId = parseInt(courseId, 10);
  if (isNaN(cId)) {
    return res.status(400).json({ error: 'Invalid course ID.' });
  }

  if (duration !== undefined && (isNaN(Number(duration)) || Number(duration) <= 0)) {
    return res.status(400).json({ error: 'Duration must be a positive number greater than 0.' });
  }

  if (passGrade !== undefined && (isNaN(Number(passGrade)) || Number(passGrade) <= 0 || Number(passGrade) > 100)) {
    return res.status(400).json({ error: 'Pass grade must be between 1 and 100.' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Exam title is required and cannot be empty.' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Exam must have at least one question.' });
  }

  try {
    // 1. Confirm exam exists
    const examCheck = await db.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    const exam = examCheck.rows[0];

    // 2. Check if the exam has submissions or has already started
    const subCheck = await db.query('SELECT COUNT(*) FROM submissions WHERE exam_id = $1', [examId]);
    const hasSubmissions = parseInt(subCheck.rows[0].count, 10) > 0;

    const currentTime = new Date();
    const start = new Date(exam.start_date);
    const isStarted = currentTime >= start;

    if (hasSubmissions || isStarted) {
      // 1. Fetch original questions to compare
      const dbQuestionsResult = await db.query('SELECT * FROM questions WHERE exam_id = $1 ORDER BY id ASC', [examId]);
      const dbQuestions = dbQuestionsResult.rows;

      const identical = await areQuestionsIdentical(questions, dbQuestions);
      if (!identical) {
        return res.status(400).json({
          error: 'Cannot edit exam structure or questions once it has started or has submissions. Use the Adjust Settings option instead.'
        });
      }

      // If they are identical, we only update the exam table metadata and skip rewriting questions (to avoid breaking foreign keys/answers)
      const examResult = await db.query(`
        UPDATE exams
        SET title = $1, course_id = $2, duration = $3, pass_grade = $4, start_date = $5, end_date = $6, are_grades_published = $7
        WHERE id = $8
        RETURNING id, title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, factor, creator_id
      `, [title.trim(), cId, duration, passGrade, startDate, endDate, areGradesPublished, examId]);

      const updatedExam = examResult.rows[0];

      // Format questions for return (same as in getExamById)
      const qIds = dbQuestions.map(q => q.id);
      const optionsResult = await db.query(
        'SELECT * FROM options WHERE question_id = ANY($1) ORDER BY id ASC',
        [qIds]
      );
      const optionsMap = {};
      optionsResult.rows.forEach(opt => {
        if (!optionsMap[opt.question_id]) {
          optionsMap[opt.question_id] = [];
        }
        optionsMap[opt.question_id].push(opt.text);
      });

      const formattedQuestions = dbQuestions.map(q => ({
        id: q.id,
        examId: q.exam_id,
        text: q.text,
        type: q.type,
        points: q.points,
        allowMultipleAnswers: q.allow_multiple_answers,
        correctAnswers: q.correct_answers,
        options: optionsMap[q.id] || []
      }));

      return res.status(200).json({
        id: updatedExam.id,
        title: updatedExam.title,
        courseId: updatedExam.course_id,
        duration: updatedExam.duration,
        passGrade: updatedExam.pass_grade,
        startDate: updatedExam.start_date,
        endDate: updatedExam.end_date,
        areGradesPublished: updatedExam.are_grades_published,
        factor: updatedExam.factor,
        creatorId: updatedExam.creator_id,
        questions: formattedQuestions
      });
    }
  } catch (err) {
    return next(err);
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Update metadata
    const examResult = await client.query(`
      UPDATE exams
      SET title = $1, course_id = $2, duration = $3, pass_grade = $4, start_date = $5, end_date = $6, are_grades_published = $7
      WHERE id = $8
      RETURNING id, title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, factor, creator_id
    `, [title.trim(), cId, duration, passGrade, startDate, endDate, areGradesPublished, examId]);

    const updatedExam = examResult.rows[0];

    // Wipe old questions and options (ON DELETE CASCADE removes options automatically)
    await client.query('DELETE FROM questions WHERE exam_id = $1', [examId]);

    const newQuestions = [];

    // Reinsert questions
    if (Array.isArray(questions)) {
      for (const q of questions) {
        const questionResult = await client.query(`
          INSERT INTO questions (exam_id, text, type, points, allow_multiple_answers, correct_answers)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, text, type, points, allow_multiple_answers, correct_answers
        `, [
          id,
          q.text,
          q.type,
          q.points || 0,
          q.allowMultipleAnswers || false,
          q.correctAnswers || []
        ]);

        const newQuestion = questionResult.rows[0];
        newQuestion.options = [];

        newQuestion.allowMultipleAnswers = newQuestion.allow_multiple_answers;
        delete newQuestion.allow_multiple_answers;
        newQuestion.correctAnswers = newQuestion.correct_answers;
        delete newQuestion.correct_answers;

        if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
          for (const optText of q.options) {
            const optionResult = await client.query(`
              INSERT INTO options (question_id, text)
              VALUES ($1, $2)
              RETURNING text
            `, [newQuestion.id, optText]);
            newQuestion.options.push(optionResult.rows[0].text);
          }
        }

        newQuestions.push(newQuestion);
      }
    }

    await client.query('COMMIT');

    res.status(200).json({
      id: updatedExam.id,
      title: updatedExam.title,
      courseId: updatedExam.course_id,
      duration: updatedExam.duration,
      passGrade: updatedExam.pass_grade,
      startDate: updatedExam.start_date,
      endDate: updatedExam.end_date,
      areGradesPublished: updatedExam.are_grades_published,
      factor: updatedExam.factor,
      creatorId: updatedExam.creator_id,
      questions: newQuestions
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * Adjusts specific settings of an exam (title, duration, endDate, passGrade, factor)
 * without touching questions/options. Safe to run for active or completed exams.
 */
const adjustExam = async (req, res, next) => {
  const { id } = req.params;
  const { title, duration, endDate, passGrade, factor } = req.body;

  const examId = parseInt(id, 10);
  if (isNaN(examId)) {
    return res.status(400).json({ error: 'Invalid exam ID.' });
  }

  if (duration !== undefined && (isNaN(Number(duration)) || Number(duration) <= 0)) {
    return res.status(400).json({ error: 'Duration must be a positive number greater than 0.' });
  }

  if (passGrade !== undefined && (isNaN(Number(passGrade)) || Number(passGrade) <= 0 || Number(passGrade) > 100)) {
    return res.status(400).json({ error: 'Pass grade must be between 1 and 100.' });
  }

  try {
    // Confirm exam exists
    const examCheck = await db.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    const originalExam = examCheck.rows[0];

    const newTitle = title !== undefined ? title : originalExam.title;
    const newDuration = duration !== undefined ? Number(duration) : originalExam.duration;
    const newEndDate = endDate !== undefined ? endDate : originalExam.end_date;
    const newPassGrade = passGrade !== undefined ? Number(passGrade) : originalExam.pass_grade;
    const newFactor = factor !== undefined ? Number(factor) : originalExam.factor;

    // Validate dates if end date is updated
    if (endDate !== undefined) {
      const start = new Date(originalExam.start_date);
      const end = new Date(newEndDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid end date.' });
      }
      if (end <= start) {
        return res.status(400).json({ error: 'End date must be strictly after start date.' });
      }
    }

    const result = await db.query(`
      UPDATE exams
      SET title = $1, duration = $2, end_date = $3, pass_grade = $4, factor = $5
      WHERE id = $6
      RETURNING id, title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, factor, creator_id
    `, [newTitle, newDuration, newEndDate, newPassGrade, newFactor, examId]);

    const updated = result.rows[0];

    res.status(200).json({
      id: updated.id,
      title: updated.title,
      courseId: updated.course_id,
      duration: updated.duration,
      passGrade: updated.pass_grade,
      startDate: updated.start_date,
      endDate: updated.end_date,
      areGradesPublished: updated.are_grades_published,
      factor: updated.factor,
      creatorId: updated.creator_id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Deletes an exam by its ID.
 */
const deleteExam = async (req, res, next) => {
  const { id } = req.params;
  const examId = parseInt(id, 10);
  if (isNaN(examId)) {
    return res.status(400).json({ error: 'Invalid exam ID.' });
  }

  try {
    const result = await db.query('DELETE FROM exams WHERE id = $1 RETURNING id', [examId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  adjustExam,
  deleteExam
};
