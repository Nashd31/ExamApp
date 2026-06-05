const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const mockDb = require('../data/mockDb');

/**
 * Resets the PostgreSQL auto-incrementing serial sequence for a table
 * to ensure that subsequent INSERTs without explicit IDs start correctly.
 */
const resetSequence = async (tableName) => {
  try {
    await db.query(`
      SELECT setval(
        COALESCE(pg_get_serial_sequence($1, 'id'), $1 || '_id_seq'),
        COALESCE(MAX(id), 1),
        MAX(id) IS NOT NULL
      ) FROM ${tableName}
    `, [tableName]);
  } catch (err) {
    console.warn(`[Warning] Could not reset sequence for ${tableName}:`, err.message);
  }
};

const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  try {
    // 1. Read and execute DDL schema script
    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Dropping and recreating database tables...');
    await db.query(schemaSql);
    console.log('Database schema initialized successfully.');

    // 2. Insert mock users
    console.log('Seeding users...');
    for (const user of mockDb.users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const avatar = user.avatar || 'initials';
      const themeColor = user.themeColor || 'blue';
      
      await db.query(`
        INSERT INTO users (id, email, password_hash, name, role, avatar, theme_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [user.id, user.email, passwordHash, user.name, user.role, avatar, themeColor]);
    }
    await resetSequence('users');

    // 3. Insert mock courses
    console.log('Seeding courses...');
    for (const course of mockDb.courses) {
      await db.query(`
        INSERT INTO courses (id, name, code, teacher_id)
        VALUES ($1, $2, $3, $4)
      `, [course.id, course.name, course.code, course.teacherId]);
    }
    await resetSequence('courses');

    // 4. Insert mock student enrollments (user_courses)
    console.log('Seeding user enrollments...');
    for (const user of mockDb.users) {
      if (user.role === 'student' && Array.isArray(user.enrolledCourses)) {
        for (const courseId of user.enrolledCourses) {
          await db.query(`
            INSERT INTO user_courses (student_id, course_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [user.id, courseId]);
        }
      }
    }

    // 5. Insert mock exams and their nested questions and options
    console.log('Seeding exams, questions, and options...');
    for (const exam of mockDb.exams) {
      const creatorId = exam.creatorId || 1; // Fallback to first user (teacher)
      
      await db.query(`
        INSERT INTO exams (id, title, course_id, duration, pass_grade, start_date, end_date, are_grades_published, creator_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        exam.id,
        exam.title,
        exam.courseId,
        exam.duration || 60,
        exam.passGrade || 50,
        exam.startDate,
        exam.endDate,
        exam.areGradesPublished || false,
        creatorId
      ]);

      if (Array.isArray(exam.questions)) {
        for (const q of exam.questions) {
          const allowMultipleAnswers = q.allowMultipleAnswers || false;
          
          await db.query(`
            INSERT INTO questions (id, exam_id, text, type, points, allow_multiple_answers, correct_answers)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            q.id,
            exam.id,
            q.text,
            q.type,
            q.points || 0,
            allowMultipleAnswers,
            q.correctAnswers || []
          ]);

          // Seed options if multiple choice question
          if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
            for (const optionText of q.options) {
              await db.query(`
                INSERT INTO options (question_id, text)
                VALUES ($1, $2)
              `, [q.id, optionText]);
            }
          }
        }
      }
    }
    await resetSequence('exams');
    await resetSequence('questions');
    await resetSequence('options');

    // 6. Insert mock submissions and their answers
    console.log('Seeding submissions and student answers...');
    for (const sub of mockDb.submissions) {
      const status = sub.status || 'submitted';
      
      await db.query(`
        INSERT INTO submissions (id, exam_id, student_id, score, status, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        sub.id,
        sub.examId,
        sub.studentId,
        sub.score || 0,
        status,
        sub.submittedAt
      ]);

      if (sub.answers && typeof sub.answers === 'object') {
        for (const [qIdStr, value] of Object.entries(sub.answers)) {
          const qId = parseInt(qIdStr, 10);
          
          let selectedOptions = null;
          let textResponse = null;
          
          if (Array.isArray(value)) {
            selectedOptions = value;
          } else if (typeof value === 'string') {
            textResponse = value;
          }

          const manualPoints = sub.manualGrades && sub.manualGrades[qIdStr] !== undefined 
            ? sub.manualGrades[qIdStr] 
            : null;
            
          const notes = sub.teacherNotes && sub.teacherNotes[qIdStr] !== undefined 
            ? sub.teacherNotes[qIdStr] 
            : null;

          await db.query(`
            INSERT INTO answers (submission_id, question_id, selected_options, text_response, manual_points, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            sub.id,
            qId,
            selectedOptions,
            textResponse,
            manualPoints,
            notes
          ]);
        }
      }
    }
    await resetSequence('submissions');
    await resetSequence('answers');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Execute seeding
seedDatabase();
