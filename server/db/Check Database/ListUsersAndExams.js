const { pool } = require('../config/db');

async function listUsersAndExams() {
  console.log('=== CONNECTING TO DATABASE ===');
  try {
    // 1. Fetch and list Users
    const usersResult = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY role, id'
    );
    console.log('\n--- REGISTERED USERS ---');
    if (usersResult.rows.length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(usersResult.rows.map(user => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Role: user.role,
        'Created At': user.created_at
      })));
    }

    // 2. Fetch and list Exams
    const examsResult = await pool.query(
      `SELECT e.id, e.title, c.name AS course_name, c.code AS course_code, 
              e.duration, e.pass_grade, e.are_grades_published, u.name AS creator_name
       FROM exams e
       LEFT JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON e.creator_id = u.id
       ORDER BY e.id`
    );
    console.log('\n--- CREATED EXAMS ---');
    if (examsResult.rows.length === 0) {
      console.log('No exams found in database.');
    } else {
      console.table(examsResult.rows.map(exam => ({
        ID: exam.id,
        Title: exam.title,
        'Course Name': exam.course_name,
        'Course Code': exam.course_code,
        'Duration (Min)': exam.duration,
        'Pass Grade (%)': exam.pass_grade,
        'Grades Published': exam.are_grades_published ? 'Yes' : 'No',
        Creator: exam.creator_name || 'System'
      })));
    }
  } catch (err) {
    console.error('Error querying database:', err.message || err);
  } finally {
    await pool.end();
    console.log('\n=== DATABASE CONNECTION CLOSED ===');
  }
}

listUsersAndExams();
