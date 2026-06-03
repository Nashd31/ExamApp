const express = require('express');
const cors = require('cors');
const mockDb = require('./data/mockDb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logger middleware to print basic console logging for server traffic auditing
app.use((req, res, next) => {
  console.log(`\n[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// --- Authentication API Endpoints ---

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`   >> auth/login: user attempt for email: ${email}`);
  const user = mockDb.users.find(u => u.email === email && u.password === password);
  if (user) {
    const userCopy = { ...user };
    delete userCopy.password;
    res.json(userCopy);
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  console.log(`   >> auth/register: new registration for email: ${email}`);
  const exists = mockDb.users.some(u => u.email === email);
  if (exists) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const newUser = {
    id: `u${Date.now()}`,
    name,
    email,
    password,
    role,
    ...(role === 'student' ? { enrolledCourses: [] } : {})
  };
  mockDb.users.push(newUser);
  const userCopy = { ...newUser };
  delete userCopy.password;
  res.status(201).json(userCopy);
});

app.put('/api/auth/profile/:id', (req, res) => {
  const { id } = req.params;
  const { name, password, avatar, themeColor } = req.body;
  console.log(`   >> auth/profile: update profile request for user ID: ${id}`);
  const user = mockDb.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.name = name;
  if (password) user.password = password;
  user.avatar = avatar;
  user.themeColor = themeColor;
  const userCopy = { ...user };
  delete userCopy.password;
  res.json(userCopy);
});

// --- Exams CRUD Endpoints ---

app.get('/api/exams', (req, res) => {
  console.log(`   >> exams/list: fetch all exams requested`);
  res.json(mockDb.exams);
});

app.get('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  console.log(`   >> exams/detail: fetch exam ID: ${id}`);
  const exam = mockDb.exams.find(e => e.id === id);
  if (exam) {
    res.json(exam);
  } else {
    res.status(404).json({ error: 'Exam not found' });
  }
});

app.post('/api/exams', (req, res) => {
  console.log(`   >> exams/create: add new exam`);
  const exam = req.body;
  const newExam = { ...exam, id: Date.now().toString() };
  mockDb.exams.push(newExam);
  res.status(201).json(newExam);
});

app.put('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  console.log(`   >> exams/update: update exam ID: ${id}`);
  const index = mockDb.exams.findIndex(e => e.id === id);
  if (index !== -1) {
    mockDb.exams[index] = { ...req.body, id };
    res.json(mockDb.exams[index]);
  } else {
    res.status(404).json({ error: 'Exam not found' });
  }
});

app.delete('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  console.log(`   >> exams/delete: remove exam ID: ${id}`);
  const index = mockDb.exams.findIndex(e => e.id === id);
  if (index !== -1) {
    mockDb.exams.splice(index, 1);
    res.status(204).end();
  } else {
    res.status(404).json({ error: 'Exam not found' });
  }
});

// --- Courses Endpoints ---

app.get('/api/courses', (req, res) => {
  console.log(`   >> courses/list: fetch all courses`);
  res.json(mockDb.courses || []);
});

app.get('/api/courses/teacher/:teacherId', (req, res) => {
  const { teacherId } = req.params;
  console.log(`   >> courses/teacher: fetch courses for teacher ID: ${teacherId}`);
  const courses = (mockDb.courses || []).filter(c => c.teacherId === teacherId);
  res.json(courses);
});

app.post('/api/courses', (req, res) => {
  const { name, code, teacherId } = req.body;
  console.log(`   >> courses/create: create course code: ${code}`);
  const codeExists = (mockDb.courses || []).some(c => c.code.toLowerCase() === code.toLowerCase());
  if (codeExists) {
    return res.status(400).json({ error: 'Course code already exists' });
  }
  const newCourse = { id: 'c' + Date.now(), name, code, teacherId };
  mockDb.courses = mockDb.courses || [];
  mockDb.courses.push(newCourse);
  res.status(201).json(newCourse);
});

app.post('/api/courses/enroll', (req, res) => {
  const { studentId, courseCode } = req.body;
  console.log(`   >> courses/enroll: student ID ${studentId} enrolling in course code: ${courseCode}`);
  const course = (mockDb.courses || []).find(c => c.code.toLowerCase() === courseCode.toLowerCase());
  if (!course) {
    return res.status(404).json({ error: 'Course code not found' });
  }
  const student = mockDb.users.find(u => u.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'User not found' });
  }
  student.enrolledCourses = student.enrolledCourses || [];
  if (student.enrolledCourses.includes(course.id)) {
    return res.status(400).json({ error: 'Already enrolled in this course' });
  }
  student.enrolledCourses.push(course.id);
  res.json(course);
});

app.get('/api/courses/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  console.log(`   >> courses/student: get courses student ID ${studentId} is enrolled in`);
  const student = mockDb.users.find(u => u.id === studentId);
  if (!student) {
    return res.json([]);
  }
  const enrolledIds = student.enrolledCourses || [];
  const courses = (mockDb.courses || []).filter(c => enrolledIds.includes(c.id));
  res.json(courses);
});

app.delete('/api/courses/:courseId/student/:studentId', (req, res) => {
  const { courseId, studentId } = req.params;
  console.log(`   >> courses/unenroll: student ID ${studentId} leaving course ID ${courseId}`);
  const student = mockDb.users.find(u => u.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'User not found' });
  }
  student.enrolledCourses = student.enrolledCourses || [];
  const index = student.enrolledCourses.indexOf(courseId);
  if (index === -1) {
    return res.status(400).json({ error: 'Not enrolled in this course' });
  }
  student.enrolledCourses.splice(index, 1);
  res.status(204).end();
});

app.delete('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  console.log(`   >> courses/delete: delete course ID: ${id}`);
  const courseIndex = (mockDb.courses || []).findIndex(c => c.id === id);
  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  mockDb.courses.splice(courseIndex, 1);
  if (mockDb.exams) {
    mockDb.exams = mockDb.exams.filter(e => e.courseId !== id);
  }
  mockDb.users.forEach(u => {
    if (u.enrolledCourses) {
      u.enrolledCourses = u.enrolledCourses.filter(cid => cid !== id);
    }
  });
  res.status(204).end();
});

// --- Submissions & Grading Endpoints ---

app.post('/api/submissions', (req, res) => {
  const { examId, studentName, answers, studentId } = req.body;
  console.log(`   >> submissions/create: student ${studentName} submit answers for exam ID ${examId}`);
  const exam = mockDb.exams.find(e => e.id === examId);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  // Ensure enrolled course list includes this course
  if (studentId && exam.courseId) {
    const student = mockDb.users.find(u => u.id === studentId);
    if (student) {
      student.enrolledCourses = student.enrolledCourses || [];
      if (!student.enrolledCourses.includes(exam.courseId)) {
        student.enrolledCourses.push(exam.courseId);
      }
    }
  }

  // Auto grade Multiple Choice
  const questions = exam.questions || [];
  let totalScore = 0;
  questions.forEach((q, index) => {
    if (!q.type || q.type === 'multiple_choice') {
      const key = q.id || index;
      const expected = q.correctAnswers;
      const given = answers[key];
      if (Array.isArray(expected) && Array.isArray(given)) {
        const isCorrect = expected.length === given.length && expected.every(val => given.includes(val));
        if (isCorrect) {
          totalScore += q.points || 0;
        }
      }
    }
  });

  const score = Math.round(totalScore);
  const newSubmission = {
    id: Date.now().toString(),
    studentName,
    examId,
    score,
    answers,
    manualGrades: {},
    submittedAt: new Date().toISOString()
  };

  mockDb.submissions = mockDb.submissions || [];
  mockDb.submissions.push(newSubmission);
  res.status(201).json({ score, submissionId: newSubmission.id });
});

app.get('/api/submissions/student/:studentName', (req, res) => {
  const { studentName } = req.params;
  console.log(`   >> submissions/student: get submissions for student Name: ${studentName}`);
  const scores = (mockDb.submissions || []).filter(s => s.studentName === studentName);
  const results = scores.map(s => {
    const exam = mockDb.exams.find(e => e.id === s.examId) || {};
    return {
      examId: s.examId,
      title: exam.title || 'Unknown Exam',
      score: s.score,
      passGrade: exam.passGrade || 50,
      areGradesPublished: exam.areGradesPublished !== false,
      submittedAt: s.submittedAt
    };
  });
  res.json(results);
});

app.get('/api/submissions/exam/:examId', (req, res) => {
  const { examId } = req.params;
  console.log(`   >> submissions/exam: get submissions for exam ID: ${examId}`);
  const submissions = (mockDb.submissions || []).filter(s => s.examId === examId);
  res.json(submissions);
});

app.get('/api/submissions/exam/:examId/student/:studentName', (req, res) => {
  const { examId, studentName } = req.params;
  console.log(`   >> submissions/student-exam: get submission of student ${studentName} on exam ID ${examId}`);
  const submission = (mockDb.submissions || []).find(s => s.examId === examId && s.studentName === studentName);
  if (submission) {
    res.json(submission);
  } else {
    res.status(404).json({ error: 'Submission not found' });
  }
});

app.get('/api/submissions/:id', (req, res) => {
  const { id } = req.params;
  console.log(`   >> submissions/detail: get submission details for ID: ${id}`);
  const submission = (mockDb.submissions || []).find(s => s.id === id);
  if (submission) {
    res.json(submission);
  } else {
    res.status(404).json({ error: 'Submission not found' });
  }
});

app.put('/api/submissions/:id/grade', (req, res) => {
  const { id } = req.params;
  const { questionId, points, notes } = req.body;
  console.log(`   >> submissions/grade: manually update question ${questionId} grade to ${points} for submission ID: ${id}`);
  const submission = (mockDb.submissions || []).find(s => s.id === id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  submission.manualGrades = submission.manualGrades || {};
  submission.manualGrades[questionId] = Number(points);

  submission.teacherNotes = submission.teacherNotes || {};
  submission.teacherNotes[questionId] = notes || '';

  // Recalculate total score
  const exam = mockDb.exams.find(e => e.id === submission.examId);
  if (exam) {
    const questions = exam.questions || [];
    let totalScore = 0;
    questions.forEach((q, index) => {
      const key = q.id || index;
      if (submission.manualGrades[key] !== undefined) {
        totalScore += submission.manualGrades[key];
      } else {
        if (!q.type || q.type === 'multiple_choice') {
          const expected = q.correctAnswers;
          const given = submission.answers[key];
          if (Array.isArray(expected) && Array.isArray(given)) {
            const isCorrect = expected.length === given.length && expected.every(val => given.includes(val));
            if (isCorrect) totalScore += q.points || 0;
          }
        }
      }
    });
    submission.score = Math.round(totalScore);
  }

  res.json(submission);
});

app.listen(PORT, () => {
  console.log(`Backend server successfully running on port ${PORT}`);
});
