const { pool } = require('../config/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (queryText) => {
  return new Promise((resolve) => rl.question(queryText, resolve));
};

async function listExamQuestions() {
  console.log('=== CONNECTING TO DATABASE ===');
  
  try {
    // 1. Prompt user for Exam ID
    const input = await askQuestion('\nEnter Exam ID: ');
    const examId = parseInt(input.trim(), 10);

    if (isNaN(examId)) {
      console.error('Error: Please enter a valid integer for Exam ID.');
      return;
    }

    // 2. Fetch exam info
    const examRes = await pool.query(
      'SELECT id, title FROM exams WHERE id = $1',
      [examId]
    );

    if (examRes.rows.length === 0) {
      console.log(`Exam with ID ${examId} not found.`);
      return;
    }

    const exam = examRes.rows[0];
    console.log(`\nFound Exam: "${exam.title}" (ID: ${exam.id})`);

    // 3. Fetch questions
    const questionsRes = await pool.query(
      'SELECT id, text, type, points, allow_multiple_answers, correct_answers FROM questions WHERE exam_id = $1 ORDER BY id',
      [examId]
    );

    if (questionsRes.rows.length === 0) {
      console.log('No questions found for this exam.');
      return;
    }

    const questions = questionsRes.rows;
    const questionIds = questions.map(q => q.id);

    // 4. Fetch options for these questions
    const optionsRes = await pool.query(
      'SELECT id, question_id, text FROM options WHERE question_id = ANY($1) ORDER BY question_id, id',
      [questionIds]
    );

    // Group options by question_id
    const optionsMap = {};
    optionsRes.rows.forEach(opt => {
      if (!optionsMap[opt.question_id]) {
        optionsMap[opt.question_id] = [];
      }
      optionsMap[opt.question_id].push(opt.text);
    });

    // 5. Output questions nicely
    console.log(`\n--- QUESTIONS LIST (${questions.length} Questions) ---`);
    questions.forEach((q, idx) => {
      console.log(`\n[Q${idx + 1}] ID: ${q.id} | Points: ${q.points} | Type: ${q.type}`);
      console.log(`Text: "${q.text}"`);
      
      if (q.type === 'multiple_choice') {
        const qOptions = optionsMap[q.id] || [];
        console.log('Options:');
        qOptions.forEach((opt, oIdx) => {
          const isCorrect = q.correct_answers && q.correct_answers.includes(oIdx);
          console.log(`  ${oIdx}. [${isCorrect ? 'x' : ' '}] ${opt}`);
        });
        console.log(`Allow Multiple Answers: ${q.allow_multiple_answers ? 'Yes' : 'No'}`);
      } else {
        console.log('Type: Open Ended Response');
      }
    });

  } catch (err) {
    console.error('Error querying database:', err.message || err);
  } finally {
    rl.close();
    await pool.end();
    console.log('\n=== DATABASE CONNECTION CLOSED ===');
  }
}

listExamQuestions();
