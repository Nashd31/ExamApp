const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../data/db.json');

// Initialize database in-memory
let dbState = null;

const loadDb = () => {
  if (dbState) return dbState;

  if (fs.existsSync(dbPath)) {
    try {
      dbState = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return dbState;
    } catch (err) {
      console.error('Error reading db.json, resetting database:', err);
    }
  }

  // Load from mockDb.js
  const mockDb = require('../data/mockDb');
  const passwordHash = bcrypt.hashSync('password', 10);

  const users = mockDb.users.map(u => ({
    id: u.id,
    email: u.email,
    password_hash: passwordHash,
    name: u.name,
    role: u.role,
    avatar: u.avatar || 'initials',
    theme_color: u.themeColor || (u.role === 'teacher' ? 'emerald' : 'indigo')
  }));

  const courses = mockDb.courses.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    teacher_id: c.teacherId
  }));

  const user_courses = [];
  mockDb.users.forEach(u => {
    if (u.role === 'student' && Array.isArray(u.enrolledCourses)) {
      u.enrolledCourses.forEach(cid => {
        user_courses.push({ student_id: u.id, course_id: cid });
      });
    }
  });

  const exams = [];
  const questions = [];
  const options = [];

  mockDb.exams.forEach(e => {
    exams.push({
      id: e.id,
      title: e.title,
      course_id: e.courseId,
      duration: e.duration || 60,
      pass_grade: e.passGrade || 50,
      start_date: e.startDate,
      end_date: e.endDate,
      are_grades_published: e.areGradesPublished || false,
      factor: e.factor || 0,
      creator_id: 1 // Default to teacher
    });

    if (Array.isArray(e.questions)) {
      e.questions.forEach(q => {
        questions.push({
          id: q.id,
          exam_id: e.id,
          text: q.text,
          type: q.type,
          points: q.points || 0,
          allow_multiple_answers: q.allowMultipleAnswers || false,
          correct_answers: q.correctAnswers || []
        });

        if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
          q.options.forEach(optText => {
            options.push({
              id: options.length + 1,
              question_id: q.id,
              text: optText
            });
          });
        }
      });
    }
  });

  const submissions = [];
  const answers = [];

  mockDb.submissions.forEach(s => {
    submissions.push({
      id: s.id,
      exam_id: s.examId,
      student_id: s.studentId,
      score: s.score || 0,
      status: s.status || 'submitted',
      submitted_at: s.submittedAt
    });

    if (s.answers && typeof s.answers === 'object') {
      Object.entries(s.answers).forEach(([qIdStr, val]) => {
        const qId = parseInt(qIdStr, 10);
        let selectedOptions = null;
        let textResponse = null;

        if (Array.isArray(val)) {
          selectedOptions = val;
        } else if (typeof val === 'string') {
          textResponse = val;
        }

        const manualPoints = s.manualGrades && s.manualGrades[qIdStr] !== undefined
          ? s.manualGrades[qIdStr]
          : null;

        const notes = s.teacherNotes && s.teacherNotes[qIdStr] !== undefined
          ? s.teacherNotes[qIdStr]
          : null;

        answers.push({
          id: answers.length + 1,
          submission_id: s.id,
          question_id: qId,
          selected_options: selectedOptions,
          text_response: textResponse,
          manual_points: manualPoints,
          notes: notes
        });
      });
    }
  });

  dbState = {
    users,
    courses,
    user_courses,
    exams,
    questions,
    options,
    submissions,
    answers
  };

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(dbState, null, 2), 'utf8');
  return dbState;
};

const saveDb = () => {
  if (!dbState) return;
  fs.writeFileSync(dbPath, JSON.stringify(dbState, null, 2), 'utf8');
};

// Main mock query executor
const query = async (text, params = []) => {
  // Ensure DB state is loaded
  loadDb();

  const cleanSql = text.trim().replace(/\s+/g, ' ');
  const cleanSqlLower = cleanSql.toLowerCase();

  // Helper: auto-generate serial keys
  const getNextId = (table) => {
    return dbState[table].reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
  };

  let rows = [];
  let rowCount = 0;

  try {
    // ----------------------------------------------------
    // DDL & TRANSACTIONS
    // ----------------------------------------------------
    if (cleanSqlLower.includes('drop table') || cleanSqlLower.includes('create table') || cleanSqlLower.includes('create type')) {
      dbState = {
        users: [],
        courses: [],
        user_courses: [],
        exams: [],
        questions: [],
        options: [],
        submissions: [],
        answers: []
      };
      saveDb();
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower === 'begin' || cleanSqlLower === 'commit' || cleanSqlLower === 'rollback') {
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.includes('select setval(')) {
      return { rows: [], rowCount: 0 };
    }

    // ----------------------------------------------------
    // USERS TABLE
    // ----------------------------------------------------
    if (cleanSqlLower.includes('select * from users where email =')) {
      const email = params[0];
      const match = dbState.users.filter(u => u.email.toLowerCase() === email.toLowerCase());
      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.includes('select * from users where id = $1 and role = \'student\'')) {
      const id = Number(params[0]);
      const match = dbState.users.filter(u => u.id === id && u.role === 'student');
      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('insert into users')) {
      // INSERT INTO users (email, password_hash, name, role, avatar, theme_color) or (id, email, password_hash...)
      const hasId = cleanSqlLower.includes('users (id,');
      let newUser;

      if (hasId) {
        newUser = {
          id: Number(params[0]),
          email: params[1],
          password_hash: params[2],
          name: params[3],
          role: params[4],
          avatar: params[5],
          theme_color: params[6]
        };
      } else {
        newUser = {
          id: getNextId('users'),
          email: params[0],
          password_hash: params[1],
          name: params[2],
          role: params[3],
          avatar: params[4] || 'initials',
          theme_color: params[5] || (params[3] === 'teacher' ? 'emerald' : 'indigo')
        };
      }

      dbState.users.push(newUser);
      saveDb();
      return { rows: [newUser], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('update users set name = $1, password_hash = $2')) {
      const [name, passwordHash, avatar, themeColor, id] = params;
      const user = dbState.users.find(u => u.id === Number(id));
      if (user) {
        user.name = name;
        user.password_hash = passwordHash;
        user.avatar = avatar;
        user.theme_color = themeColor;
        saveDb();
        return { rows: [user], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('update users set name = $1, avatar = $2, theme_color = $3 where id = $4')) {
      const [name, avatar, themeColor, id] = params;
      const user = dbState.users.find(u => u.id === Number(id));
      if (user) {
        user.name = name;
        user.avatar = avatar;
        user.theme_color = themeColor;
        saveDb();
        return { rows: [user], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // ----------------------------------------------------
    // COURSES TABLE & ENROLLMENTS (USER_COURSES)
    // ----------------------------------------------------
    if (cleanSqlLower.startsWith('select * from courses order by id asc')) {
      return { rows: [...dbState.courses].sort((a, b) => a.id - b.id), rowCount: dbState.courses.length };
    }

    if (cleanSqlLower.startsWith('select * from courses where teacher_id = $1 order by id asc')) {
      const teacherId = Number(params[0]);
      const match = dbState.courses.filter(c => c.teacher_id === teacherId).sort((a, b) => a.id - b.id);
      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('select * from courses where lower(code) = lower($1)')) {
      const code = params[0];
      const match = dbState.courses.filter(c => c.code.toLowerCase() === code.toLowerCase());
      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('insert into courses')) {
      // INSERT INTO courses (name, code, teacher_id) or (id, name, code, teacher_id)
      const hasId = cleanSqlLower.includes('courses (id,');
      let newCourse;

      if (hasId) {
        newCourse = {
          id: Number(params[0]),
          name: params[1],
          code: params[2],
          teacher_id: Number(params[3])
        };
      } else {
        newCourse = {
          id: getNextId('courses'),
          name: params[0],
          code: params[1],
          teacher_id: Number(params[2])
        };
      }

      dbState.courses.push(newCourse);
      saveDb();
      return { rows: [newCourse], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('select * from user_courses where student_id = $1 and course_id = $2')) {
      const [sId, cId] = params.map(Number);
      const match = dbState.user_courses.filter(uc => uc.student_id === sId && uc.course_id === cId);
      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('insert into user_courses')) {
      const [sId, cId] = params.map(Number);
      const exists = dbState.user_courses.some(uc => uc.student_id === sId && uc.course_id === cId);
      if (!exists) {
        dbState.user_courses.push({ student_id: sId, course_id: cId });
        saveDb();
      }
      return { rows: [], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('select c.*, u.name as "teachername"')) {
      // Joined courses for student
      const studentId = Number(params[0]);
      const enrolledCourseIds = dbState.user_courses
        .filter(uc => uc.student_id === studentId)
        .map(uc => uc.course_id);

      const studentCourses = dbState.courses
        .filter(c => enrolledCourseIds.includes(c.id))
        .map(c => {
          const teacher = dbState.users.find(u => u.id === c.teacher_id) || {};
          return {
            ...c,
            teacherName: teacher.name || 'Unknown Teacher'
          };
        })
        .sort((a, b) => a.id - b.id);

      return { rows: studentCourses, rowCount: studentCourses.length };
    }

    if (cleanSqlLower.startsWith('delete from user_courses where student_id = $1 and course_id = $2')) {
      const [sId, cId] = params.map(Number);
      const prevLength = dbState.user_courses.length;
      dbState.user_courses = dbState.user_courses.filter(uc => !(uc.student_id === sId && uc.course_id === cId));
      if (dbState.user_courses.length !== prevLength) {
        saveDb();
      }
      return { rows: [{}], rowCount: prevLength - dbState.user_courses.length };
    }

    if (cleanSqlLower.startsWith('delete from courses where id = $1')) {
      const id = Number(params[0]);
      dbState.courses = dbState.courses.filter(c => c.id !== id);
      dbState.user_courses = dbState.user_courses.filter(uc => uc.course_id !== id);
      
      const courseExams = dbState.exams.filter(e => e.course_id === id).map(e => e.id);
      dbState.exams = dbState.exams.filter(e => e.course_id !== id);
      dbState.questions = dbState.questions.filter(q => !courseExams.includes(q.exam_id));
      dbState.submissions = dbState.submissions.filter(s => !courseExams.includes(s.exam_id));

      saveDb();
      return { rows: [{ id }], rowCount: 1 };
    }

    // ----------------------------------------------------
    // EXAMS TABLE
    // ----------------------------------------------------
    if (cleanSqlLower.startsWith('select e.*, coalesce(s.submission_count, 0)')) {
      // Get exams with count of submissions
      const teacherId = Number(params[0]);
      const exams = dbState.exams.filter(e => e.creator_id === teacherId);

      const resultExams = exams.map(e => {
        const count = dbState.submissions.filter(s => s.exam_id === e.id).length;
        return {
          ...e,
          submission_count: count
        };
      }).sort((a, b) => a.id - b.id);

      return { rows: resultExams, rowCount: resultExams.length };
    }

    if (cleanSqlLower.startsWith('select * from exams order by id asc')) {
      return { rows: [...dbState.exams].sort((a, b) => a.id - b.id), rowCount: dbState.exams.length };
    }

    if (cleanSqlLower.startsWith('select * from exams where id = $1')) {
      const id = Number(params[0]);
      const match = dbState.exams.filter(e => e.id === id);
      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('insert into exams')) {
      // INSERT INTO exams (...)
      const hasId = cleanSqlLower.includes('exams (id,');
      let newExam;

      if (hasId) {
        newExam = {
          id: Number(params[0]),
          title: params[1],
          course_id: Number(params[2]),
          duration: Number(params[3]),
          pass_grade: Number(params[4]),
          start_date: params[5],
          end_date: params[6],
          are_grades_published: params[7] === true || params[7] === 'true',
          factor: Number(params[8]) || 0,
          creator_id: Number(params[9])
        };
      } else {
        newExam = {
          id: getNextId('exams'),
          title: params[0],
          course_id: Number(params[1]),
          duration: Number(params[2]),
          pass_grade: Number(params[3]),
          start_date: params[4],
          end_date: params[5],
          are_grades_published: params[6] === true,
          factor: 0,
          creator_id: Number(params[7])
        };
      }

      dbState.exams.push(newExam);
      saveDb();
      return { rows: [newExam], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('update exams set title = $1, course_id = $2, duration = $3, pass_grade = $4, start_date = $5, end_date = $6, are_grades_published = $7 where id = $8')) {
      const [title, courseId, duration, passGrade, startDate, endDate, areGradesPublished, id] = params;
      const exam = dbState.exams.find(e => e.id === Number(id));
      if (exam) {
        exam.title = title;
        exam.course_id = Number(courseId);
        exam.duration = Number(duration);
        exam.pass_grade = Number(passGrade);
        exam.start_date = startDate;
        exam.end_date = endDate;
        exam.are_grades_published = areGradesPublished === true || areGradesPublished === 'true';
        saveDb();
        return { rows: [exam], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('update exams set title = $1, duration = $2, end_date = $3, pass_grade = $4, factor = $5, are_grades_published = $6 where id = $7')) {
      const [title, duration, endDate, passGrade, factor, areGradesPublished, id] = params;
      const exam = dbState.exams.find(e => e.id === Number(id));
      if (exam) {
        exam.title = title;
        exam.duration = Number(duration);
        exam.end_date = endDate;
        exam.pass_grade = Number(passGrade);
        exam.factor = Number(factor);
        exam.are_grades_published = areGradesPublished === true || areGradesPublished === 'true';
        saveDb();
        return { rows: [exam], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('delete from exams where id = $1')) {
      const id = Number(params[0]);
      dbState.exams = dbState.exams.filter(e => e.id !== id);
      dbState.questions = dbState.questions.filter(q => q.exam_id !== id);
      dbState.submissions = dbState.submissions.filter(s => s.exam_id !== id);
      saveDb();
      return { rows: [{ id }], rowCount: 1 };
    }

    // ----------------------------------------------------
    // QUESTIONS & OPTIONS TABLES
    // ----------------------------------------------------
    if (cleanSqlLower.startsWith('select * from questions where exam_id =')) {
      // Can be where exam_id = $1 or where exam_id = any($1)
      const examIdParam = params[0];
      let match;
      if (Array.isArray(examIdParam)) {
        const ids = examIdParam.map(Number);
        match = dbState.questions.filter(q => ids.includes(q.exam_id));
      } else {
        match = dbState.questions.filter(q => q.exam_id === Number(examIdParam));
      }
      return { rows: match.sort((a, b) => a.id - b.id), rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('insert into questions')) {
      const hasId = cleanSqlLower.includes('questions (id,');
      let newQ;

      if (hasId) {
        newQ = {
          id: Number(params[0]),
          exam_id: Number(params[1]),
          text: params[2],
          type: params[3],
          points: Number(params[4]),
          allow_multiple_answers: params[5] === true || params[5] === 'true',
          correct_answers: params[6] || []
        };
      } else {
        newQ = {
          id: getNextId('questions'),
          exam_id: Number(params[0]),
          text: params[1],
          type: params[2],
          points: Number(params[3]),
          allow_multiple_answers: params[4] === true,
          correct_answers: params[5] || []
        };
      }

      dbState.questions.push(newQ);
      saveDb();
      return { rows: [newQ], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('select * from options where question_id =')) {
      const questionIdParam = params[0];
      let match;
      if (Array.isArray(questionIdParam)) {
        const ids = questionIdParam.map(Number);
        match = dbState.options.filter(o => ids.includes(o.question_id));
      } else {
        match = dbState.options.filter(o => o.question_id === Number(questionIdParam));
      }
      return { rows: match.sort((a, b) => a.id - b.id), rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('insert into options')) {
      const newOpt = {
        id: getNextId('options'),
        question_id: Number(params[0]),
        text: params[1]
      };
      dbState.options.push(newOpt);
      saveDb();
      return { rows: [newOpt], rowCount: 1 };
    }

    // ----------------------------------------------------
    // SUBMISSIONS & ANSWERS TABLES
    // ----------------------------------------------------
    if (cleanSqlLower.startsWith('select count(*) from submissions where exam_id = $1')) {
      const examId = Number(params[0]);
      const count = dbState.submissions.filter(s => s.exam_id === examId).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('insert into submissions')) {
      // INSERT INTO submissions (exam_id, student_id, score, status, submitted_at) or (id, exam_id...)
      const hasId = cleanSqlLower.includes('submissions (id,');
      let newSub;

      if (hasId) {
        newSub = {
          id: Number(params[0]),
          exam_id: Number(params[1]),
          student_id: Number(params[2]),
          score: Number(params[3]),
          status: params[4],
          submitted_at: params[5]
        };
      } else {
        newSub = {
          id: getNextId('submissions'),
          exam_id: Number(params[0]),
          student_id: Number(params[1]),
          score: Number(params[2]),
          status: params[3],
          submitted_at: new Date().toISOString()
        };
      }

      dbState.submissions.push(newSub);
      saveDb();
      return { rows: [newSub], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('insert into answers')) {
      const hasId = cleanSqlLower.includes('answers (id,');
      let newAns;

      if (hasId) {
        newAns = {
          id: Number(params[0]),
          submission_id: Number(params[1]),
          question_id: Number(params[2]),
          selected_options: params[3],
          text_response: params[4],
          manual_points: params[5] !== undefined ? Number(params[5]) : null,
          notes: params[6] || null
        };
      } else {
        newAns = {
          id: getNextId('answers'),
          submission_id: Number(params[0]),
          question_id: Number(params[1]),
          selected_options: params[2],
          text_response: params[3],
          manual_points: null,
          notes: null
        };
      }

      dbState.answers.push(newAns);
      saveDb();
      return { rows: [newAns], rowCount: 1 };
    }

    if (cleanSqlLower.startsWith('select * from answers where submission_id = $1')) {
      const subId = Number(params[0]);
      const match = dbState.answers.filter(a => a.submission_id === subId);
      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('select s.id as "submissionid", s.exam_id as "examid", s.score, s.submitted_at as "submittedat", e.title')) {
      // Submissions list for student
      const studentId = Number(params[0]);
      const match = dbState.submissions
        .filter(s => s.student_id === studentId)
        .map(s => {
          const exam = dbState.exams.find(e => e.id === s.exam_id) || {};
          return {
            submissionId: s.id,
            examId: s.exam_id,
            score: s.score,
            submittedAt: s.submitted_at,
            title: exam.title,
            passGrade: exam.pass_grade,
            areGradesPublished: exam.are_grades_published,
            factor: exam.factor
          };
        })
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('select s.id as "submissionid", s.student_id as "studentid", s.score, s.status, s.submitted_at as "submittedat", u.name as "studentname"')) {
      // Submissions list for teacher
      const examId = Number(params[0]);
      const match = dbState.submissions
        .filter(s => s.exam_id === examId)
        .map(s => {
          const user = dbState.users.find(u => u.id === s.student_id) || {};
          return {
            submissionId: s.id,
            studentId: s.student_id,
            score: s.score,
            status: s.status,
            submittedAt: s.submitted_at,
            studentName: user.name,
            studentEmail: user.email
          };
        })
        .sort((a, b) => a.submissionId - b.submissionId);

      return { rows: match, rowCount: match.length };
    }

    if (cleanSqlLower.startsWith('select s.id as "submissionid", s.exam_id as "examid", s.score, s.status, s.submitted_at as "submittedat", e.title') && cleanSqlLower.includes('s.student_id = $2 limit 1')) {
      // Single submission checking
      const [examId, studentId] = params.map(Number);
      const sub = dbState.submissions.find(s => s.exam_id === examId && s.student_id === studentId);
      if (sub) {
        const exam = dbState.exams.find(e => e.id === examId) || {};
        const formatted = {
          submissionId: sub.id,
          examId: sub.exam_id,
          score: sub.score,
          status: sub.status,
          submittedAt: sub.submitted_at,
          title: exam.title,
          passGrade: exam.pass_grade,
          areGradesPublished: exam.are_grades_published,
          factor: exam.factor
        };
        return { rows: [formatted], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('select s.*, u.name as "studentname", u.email as "studentemail", e.title as "examtitle"')) {
      const id = Number(params[0]);
      const sub = dbState.submissions.find(s => s.id === id);
      if (sub) {
        const user = dbState.users.find(u => u.id === sub.student_id) || {};
        const exam = dbState.exams.find(e => e.id === sub.exam_id) || {};
        const joined = {
          ...sub,
          studentName: user.name,
          student_name: user.name,
          student_avatar: user.avatar,
          studentEmail: user.email,
          examTitle: exam.title,
          passGrade: exam.pass_grade,
          areGradesPublished: exam.are_grades_published,
          factor: exam.factor
        };
        return { rows: [joined], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('select s.*, u.name as student_name, u.avatar as student_avatar, e.factor')) {
      const id = Number(params[0]);
      const sub = dbState.submissions.find(s => s.id === id);
      if (sub) {
        const user = dbState.users.find(u => u.id === sub.student_id) || {};
        const exam = dbState.exams.find(e => e.id === sub.exam_id) || {};
        const joined = {
          ...sub,
          student_name: user.name,
          student_avatar: user.avatar,
          factor: exam.factor
        };
        return { rows: [joined], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('update submissions set score = $1, status = $2 where id = $3')) {
      const [score, status, id] = params;
      const sub = dbState.submissions.find(s => s.id === Number(id));
      if (sub) {
        sub.score = Number(score);
        sub.status = status;
        saveDb();
        return { rows: [sub], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('update answers set manual_points = $1, notes = $2 where submission_id = $3 and question_id = $4')) {
      const [points, notes, subId, qId] = params;
      const ans = dbState.answers.find(a => a.submission_id === Number(subId) && a.question_id === Number(qId));
      if (ans) {
        ans.manual_points = points !== null ? Number(points) : null;
        ans.notes = notes || null;
        saveDb();
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (cleanSqlLower.startsWith('insert into answers (submission_id, question_id, manual_points, notes)')) {
      const [subId, qId, points, notes] = params;
      const newAns = {
        id: getNextId('answers'),
        submission_id: Number(subId),
        question_id: Number(qId),
        selected_options: null,
        text_response: null,
        manual_points: points !== null ? Number(points) : null,
        notes: notes || null
      };
      dbState.answers.push(newAns);
      saveDb();
      return { rows: [], rowCount: 1 };
    }

    console.warn(`[jsonDbEngine] Warning: Unhandled SQL pattern query: "${cleanSql}" with params:`, params);
    return { rows: [], rowCount: 0 };

  } catch (err) {
    console.error(`[jsonDbEngine] Query Error on: "${cleanSql}":`, err);
    throw err;
  }
};

// Mock connection client for transactions
const mockConnect = async () => {
  return {
    query: async (text, params) => {
      return query(text, params);
    },
    release: () => {}
  };
};

module.exports = {
  query,
  pool: {
    connect: mockConnect,
    query: async (text, params) => {
      return query(text, params);
    }
  }
};
