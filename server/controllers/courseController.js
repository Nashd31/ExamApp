const db = require('../config/db');

/**
 * Retrieves all courses from the database.
 */
const getAllCourses = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM courses ORDER BY id ASC');
    const courses = result.rows.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      teacherId: c.teacher_id
    }));
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves courses taught by a specific teacher.
 */
const getCoursesByTeacher = async (req, res, next) => {
  const { teacherId } = req.params;
  try {
    const result = await db.query('SELECT * FROM courses WHERE teacher_id = $1 ORDER BY id ASC', [teacherId]);
    const courses = result.rows.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      teacherId: c.teacher_id
    }));
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

/**
 * Creates a new course in the system.
 */
const createCourse = async (req, res, next) => {
  const { name, code, teacherId } = req.body;

  if (!name || !code || !teacherId) {
    return res.status(400).json({ error: 'All fields (name, code, teacherId) are required.' });
  }

  try {
    // Check if course code already exists
    const codeExists = await db.query('SELECT * FROM courses WHERE LOWER(code) = LOWER($1)', [code]);
    if (codeExists.rows.length > 0) {
      return res.status(400).json({ error: 'Course code already exists.' });
    }

    const result = await db.query(
      'INSERT INTO courses (name, code, teacher_id) VALUES ($1, $2, $3) RETURNING id, name, code, teacher_id',
      [name, code, teacherId]
    );

    const c = result.rows[0];
    res.status(201).json({
      id: c.id,
      name: c.name,
      code: c.code,
      teacherId: c.teacher_id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Enrolls a student in a course by course code.
 */
const enrollStudent = async (req, res, next) => {
  const { studentId, courseCode } = req.body;

  if (!studentId || !courseCode) {
    return res.status(400).json({ error: 'studentId and courseCode are required.' });
  }

  try {
    // Find course by code
    const courseResult = await db.query('SELECT * FROM courses WHERE LOWER(code) = LOWER($1)', [courseCode]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course code not found.' });
    }
    const course = courseResult.rows[0];

    // Confirm student user exists
    const studentResult = await db.query("SELECT * FROM users WHERE id = $1 AND role = 'student'", [studentId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student user not found.' });
    }

    // Check if student is already enrolled
    const enrollmentCheck = await db.query(
      'SELECT * FROM user_courses WHERE student_id = $1 AND course_id = $2',
      [studentId, course.id]
    );
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course.' });
    }

    // Enroll student
    await db.query('INSERT INTO user_courses (student_id, course_id) VALUES ($1, $2)', [studentId, course.id]);

    res.status(200).json({
      id: course.id,
      name: course.name,
      code: course.code,
      teacherId: course.teacher_id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves courses a specific student is enrolled in.
 */
const getStudentCourses = async (req, res, next) => {
  const { studentId } = req.params;
  try {
    const result = await db.query(`
      SELECT c.* 
      FROM courses c 
      JOIN user_courses uc ON c.id = uc.course_id 
      WHERE uc.student_id = $1 
      ORDER BY c.id ASC
    `, [studentId]);

    const courses = result.rows.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      teacherId: c.teacher_id
    }));
    
    res.status(200).json(courses);
  } catch (err) {
    next(err);
  }
};

/**
 * Unenrolls a student from a course.
 */
const unenrollStudent = async (req, res, next) => {
  const { courseId, studentId } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM user_courses WHERE student_id = $1 AND course_id = $2 RETURNING *',
      [studentId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'You are not enrolled in this course.' });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

/**
 * Deletes a course (cascades automatically to user_courses and exams/questions/options).
 */
const deleteCourse = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCourses,
  getCoursesByTeacher,
  createCourse,
  enrollStudent,
  getStudentCourses,
  unenrollStudent,
  deleteCourse
};
