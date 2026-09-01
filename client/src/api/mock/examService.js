import mockDb, { saveToStorage } from '../mockDb.js';

// Helper to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retrieves exams. If teacherId is provided, returns only that teacher's exams.
 */
export const getAllExams = async (teacherId) => {
  await delay();
  let exams = [...mockDb.exams];
  if (teacherId) {
    const tId = Number(teacherId);
    const teacherCourses = (mockDb.courses || [])
      .filter(c => Number(c.teacherId) === tId)
      .map(c => Number(c.id));

    exams = exams.filter(e => 
      Number(e.creatorId) === tId || 
      Number(e.teacherId) === tId || 
      teacherCourses.includes(Number(e.courseId))
    );
  }
  return exams.map(e => ({
    ...e,
    submissionCount: (mockDb.submissions || []).filter(s => Number(s.examId) === Number(e.id)).length
  }));
};

/**
 * Retrieves a specific exam by its ID.
 */
export const getExamById = async (id) => {
  await delay();
  const exam = mockDb.exams.find(e => e.id === Number(id));
  if (!exam) {
    throw new Error('Exam not found.');
  }
  return exam;
};

/**
 * Creates a new exam.
 */
export const createExam = async (exam) => {
  await delay();
  const newExamId = mockDb.exams.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  
  let qCounter = mockDb.exams.reduce((max, e) => {
    const maxQ = (e.questions || []).reduce((mq, q) => Math.max(mq, q.id), 0);
    return Math.max(max, maxQ);
  }, 0);

  const formattedQuestions = (exam.questions || []).map(q => {
    qCounter += 1;
    return {
      ...q,
      id: qCounter,
      allowMultipleAnswers: q.allowMultipleAnswers !== undefined ? q.allowMultipleAnswers : false,
      correctAnswers: q.correctAnswers || []
    };
  });

  const newExam = {
    ...exam,
    id: newExamId,
    courseId: Number(exam.courseId),
    creatorId: Number(exam.creatorId || exam.teacherId || 1),
    teacherId: Number(exam.teacherId || exam.creatorId || 1),
    duration: Number(exam.duration) || 60,
    passGrade: Number(exam.passGrade) || 50,
    factor: Number(exam.factor) || 0,
    areGradesPublished: exam.areGradesPublished !== undefined ? exam.areGradesPublished : false,
    questions: formattedQuestions
  };

  mockDb.exams.push(newExam);
  saveToStorage(mockDb);
  return newExam;
};

/**
 * Updates an existing exam.
 */
export const updateExam = async (updatedExam) => {
  await delay();
  const idx = mockDb.exams.findIndex(e => e.id === Number(updatedExam.id));
  if (idx === -1) {
    throw new Error('Exam not found.');
  }

  const existing = mockDb.exams[idx];
  const mergedExam = {
    ...existing,
    ...updatedExam,
    duration: Number(updatedExam.duration) || existing.duration,
    passGrade: Number(updatedExam.passGrade) || existing.passGrade,
    factor: Number(updatedExam.factor) || existing.factor
  };

  mockDb.exams[idx] = mergedExam;
  saveToStorage(mockDb);
  return mergedExam;
};

/**
 * Deletes an exam by its ID.
 */
export const deleteExam = async (id) => {
  await delay();
  mockDb.exams = mockDb.exams.filter(e => e.id !== Number(id));
  // Clean up submissions for this exam
  mockDb.submissions = mockDb.submissions.filter(s => s.examId !== Number(id));
  saveToStorage(mockDb);
  return { id };
};

/**
 * Submits student answers for grading.
 */
export const submitExam = async (examId, studentName, studentAnswers, studentId = null) => {
  await delay();
  const exam = mockDb.exams.find(e => e.id === Number(examId));
  if (!exam) {
    throw new Error('Exam not found.');
  }

  // Auto-grade multiple choice questions
  let score = 0;
  (exam.questions || []).forEach(q => {
    const val = studentAnswers[q.id];
    if (q.type === 'multiple_choice') {
      const correct = q.correctAnswers || [];
      const given = val || [];
      if (Array.isArray(correct) && Array.isArray(given)) {
        const isCorrect = correct.length === given.length && 
                          correct.every(v => given.includes(v));
        if (isCorrect) {
          score += (q.points || 0);
        }
      }
    }
  });

  const submissionId = mockDb.submissions.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  const newSubmission = {
    id: submissionId,
    examId: Number(examId),
    studentName,
    studentId: studentId ? Number(studentId) : 999, // default fallback student id
    score: Math.round(score),
    status: 'submitted',
    answers: studentAnswers,
    manualGrades: {},
    teacherNotes: {},
    submittedAt: new Date().toISOString()
  };

  mockDb.submissions.push(newSubmission);
  saveToStorage(mockDb);
  
  // Return the score structure expected by the examService.js promise chain
  return { score: newSubmission.score };
};

/**
 * Retrieves student submissions by student name.
 */
export const getStudentSubmissions = async (studentName) => {
  await delay();
  const subs = mockDb.submissions.filter(s => s.studentName === studentName);
  
  // Join with exam title/settings for list display
  return subs.map(s => {
    const exam = mockDb.exams.find(e => e.id === s.examId) || {};
    return {
      examId: s.examId,
      title: exam.title || 'Unknown Exam',
      score: Math.min(s.score + (exam.factor || 0), 100),
      passGrade: exam.passGrade || 50,
      areGradesPublished: exam.areGradesPublished !== false,
      submittedAt: s.submittedAt
    };
  });
};

/**
 * Retrieves submissions associated with a specific exam.
 */
export const getExamSubmissions = async (examId) => {
  await delay();
  const subs = mockDb.submissions.filter(s => s.examId === Number(examId));
  return subs;
};

/**
 * Retrieves student submission for a given exam.
 */
export const getStudentSubmission = async (examId, studentName) => {
  await delay();
  const sub = mockDb.submissions.find(s => s.examId === Number(examId) && s.studentName === studentName);
  if (!sub) {
    throw new Error('Submission not found.');
  }

  // Join with exam details
  const exam = mockDb.exams.find(e => e.id === sub.examId) || {};
  return {
    ...sub,
    examTitle: exam.title,
    passGrade: exam.passGrade,
    areGradesPublished: exam.areGradesPublished,
    factor: exam.factor
  };
};

/**
 * Retrieves submission by ID.
 */
export const getSubmissionById = async (submissionId) => {
  await delay();
  const sub = mockDb.submissions.find(s => s.id === Number(submissionId));
  if (!sub) {
    throw new Error('Submission not found.');
  }

  const exam = mockDb.exams.find(e => e.id === sub.examId) || {};
  return {
    ...sub,
    examTitle: exam.title,
    passGrade: exam.passGrade,
    areGradesPublished: exam.areGradesPublished,
    factor: exam.factor
  };
};

/**
 * Updates a student's submission grade and feedback.
 */
export const updateSubmissionGrade = async (submissionId, questionId, points, notes) => {
  await delay();
  const idx = mockDb.submissions.findIndex(s => s.id === Number(submissionId));
  if (idx === -1) {
    throw new Error('Submission not found.');
  }

  const sub = mockDb.submissions[idx];
  const exam = mockDb.exams.find(e => e.id === sub.examId);
  if (!exam) {
    throw new Error('Associated exam not found.');
  }

  // Save manual grades and notes
  sub.manualGrades = sub.manualGrades || {};
  sub.teacherNotes = sub.teacherNotes || {};
  sub.manualGrades[questionId] = Number(points);
  sub.teacherNotes[questionId] = notes || '';

  // Recalculate score
  let totalScore = 0;
  (exam.questions || []).forEach(q => {
    if (sub.manualGrades[q.id] !== undefined) {
      totalScore += sub.manualGrades[q.id];
    } else if (q.type === 'multiple_choice') {
      const correct = q.correctAnswers || [];
      const given = sub.answers[q.id] || [];
      if (Array.isArray(correct) && Array.isArray(given)) {
        const isCorrect = correct.length === given.length && 
                          correct.every(v => given.includes(v));
        if (isCorrect) {
          totalScore += (q.points || 0);
        }
      }
    }
  });

  sub.score = Math.round(totalScore);
  sub.status = 'graded';

  mockDb.submissions[idx] = sub;
  saveToStorage(mockDb);

  return {
    ...sub,
    examTitle: exam.title,
    passGrade: exam.passGrade,
    areGradesPublished: exam.areGradesPublished,
    factor: exam.factor
  };
};

/**
 * Retrieves courses taught by a specific teacher.
 */
export const getCoursesByTeacher = async (teacherId) => {
  await delay();
  return mockDb.courses.filter(c => c.teacherId === Number(teacherId));
};

/**
 * Creates a new course.
 */
export const createCourse = async (courseName, courseCode, teacherId) => {
  await delay();
  const codeExists = mockDb.courses.some(c => c.code.toLowerCase() === courseCode.toLowerCase());
  if (codeExists) {
    throw new Error('Course code already exists.');
  }

  const newId = mockDb.courses.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const newCourse = {
    id: newId,
    name: courseName,
    code: courseCode,
    teacherId: Number(teacherId)
  };

  mockDb.courses.push(newCourse);
  saveToStorage(mockDb);
  return newCourse;
};

/**
 * Retrieves courses a student is enrolled in.
 */
export const getStudentEnrolledCourses = async (studentId) => {
  await delay();
  const student = mockDb.users.find(u => u.id === Number(studentId));
  if (!student || !Array.isArray(student.enrolledCourses)) {
    return [];
  }

  const enrolled = mockDb.courses.filter(c => student.enrolledCourses.includes(c.id));
  
  // Attach teacher name
  return enrolled.map(c => {
    const teacher = mockDb.users.find(u => u.id === c.teacherId) || {};
    return {
      ...c,
      teacherName: teacher.name || 'Unknown Teacher'
    };
  });
};

/**
 * Unenrolls/removes a student from a course.
 */
export const unenrollStudentFromCourse = async (studentId, courseId) => {
  await delay();
  const idx = mockDb.users.findIndex(u => u.id === Number(studentId));
  if (idx !== -1) {
    const student = mockDb.users[idx];
    if (Array.isArray(student.enrolledCourses)) {
      student.enrolledCourses = student.enrolledCourses.filter(cid => cid !== Number(courseId));
      mockDb.users[idx] = student;
      saveToStorage(mockDb);
    }
  }
  return { success: true };
};

/**
 * Adjusts exam settings (factor, areGradesPublished, etc.).
 */
export const adjustExam = async (examId, adjustments) => {
  await delay();
  const idx = mockDb.exams.findIndex(e => e.id === Number(examId));
  if (idx === -1) {
    throw new Error('Exam not found.');
  }

  const exam = mockDb.exams[idx];
  const updatedExam = {
    ...exam,
    ...adjustments
  };

  mockDb.exams[idx] = updatedExam;
  saveToStorage(mockDb);
  return updatedExam;
};

/**
 * Deletes a course.
 */
export const deleteCourse = async (courseId) => {
  await delay();
  mockDb.courses = mockDb.courses.filter(c => c.id !== Number(courseId));
  
  // Unenroll all students
  mockDb.users = mockDb.users.map(u => {
    if (Array.isArray(u.enrolledCourses)) {
      return {
        ...u,
        enrolledCourses: u.enrolledCourses.filter(cid => cid !== Number(courseId))
      };
    }
    return u;
  });

  // Clean up exams associated with this course
  const courseExams = mockDb.exams.filter(e => e.courseId === Number(courseId));
  const courseExamIds = courseExams.map(e => e.id);
  
  mockDb.exams = mockDb.exams.filter(e => e.courseId !== Number(courseId));
  mockDb.submissions = mockDb.submissions.filter(s => !courseExamIds.includes(s.examId));

  saveToStorage(mockDb);
  return { id: courseId };
};
