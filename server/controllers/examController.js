const db = require('../config/db');

/**
 * Retrieves all exams from the database, including their nested questions and options.
 */
const getAllExams = async (req, res, next) => {
  try {
    const examsResult = await db.query('SELECT * FROM exams ORDER BY id ASC');
    const exams = examsResult.rows;
    if (exams.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch all questions
    const questionsResult = await db.query('SELECT * FROM questions ORDER BY id ASC');
    const questions = questionsResult.rows;

    // Fetch all options
    const optionsResult = await db.query('SELECT * FROM options ORDER BY id ASC');
    const options = optionsResult.rows;

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

      // Student security filter: Exclude correctAnswers
      const questionsForUser = examQuestions.map(q => {
        const qCopy = { ...q };
        if (isStudent) {
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
        duration: e.duration,
        passGrade: e.pass_grade,
        creatorId: e.creator_id,
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

  try {
    const examResult = await db.query('SELECT * FROM exams WHERE id = $1', [id]);
    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    
    const e = examResult.rows[0];

    // Fetch questions
    const questionsResult = await db.query('SELECT * FROM questions WHERE exam_id = $1 ORDER BY id ASC', [id]);
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

      questions.forEach(q => {
        q.options = optionsMap[q.id] || [];
        q.allowMultipleAnswers = q.allow_multiple_answers;
        delete q.allow_multiple_answers;
        q.correctAnswers = q.correct_answers;
        delete q.correct_answers;

        if (isStudent) {
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

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const examResult = await client.query(`
      INSERT INTO exams (title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, creator_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, creator_id
    `, [title, courseId, duration || 60, passGrade || 50, startDate, endDate, areGradesPublished || false, creatorId]);

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

/**
 * Updates an existing exam by replacing its questions and options inside a transaction.
 */
const updateExam = async (req, res, next) => {
  const { id } = req.params;
  const { title, courseId, duration, passGrade, startDate, endDate, areGradesPublished, questions } = req.body;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Confirm exam exists
    const examCheck = await client.query('SELECT * FROM exams WHERE id = $1', [id]);
    if (examCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // Update metadata
    const examResult = await client.query(`
      UPDATE exams
      SET title = $1, course_id = $2, duration = $3, pass_grade = $4, start_date = $5, end_date = $6, are_grades_published = $7
      WHERE id = $8
      RETURNING id, title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, creator_id
    `, [title, courseId, duration, passGrade, startDate, endDate, areGradesPublished, id]);

    const updatedExam = examResult.rows[0];

    // Wipe old questions and options (ON DELETE CASCADE removes options automatically)
    await client.query('DELETE FROM questions WHERE exam_id = $1', [id]);

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
 * Deletes an exam by its ID.
 */
const deleteExam = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM exams WHERE id = $1 RETURNING id', [id]);
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
  deleteExam
};
