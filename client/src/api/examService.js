import mockDb, { saveToStorage } from './mockDb';
import config from '../services/config';

const DELAY = config.MOCK_API_DELAY;
const BASE_URL = config.API_BASE_URL;

// Helper to standardise responses and propagate backend errors properly to caller
const handleResponse = async (res) => {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return;
  return res.json();
};

/**
 * Retrieves all exams.
 */
export const getAllExams = () => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/exams`).then(handleResponse);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockDb.exams]);
    }, DELAY);
  });
};

/**
 * Retrieves a specific exam by its ID.
 */
export const getExamById = (id) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/exams/${id}`).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exam = mockDb.exams.find(e => e.id === id);
      if (exam) {
        resolve({ ...exam });
      } else {
        reject(new Error("Exam not found"));
      }
    }, DELAY);
  });
};

/**
 * Creates a new exam.
 */
export const createExam = (exam) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    }).then(handleResponse);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const examData = { ...exam };
      delete examData.isNew;
      const newExam = { ...examData, id: Date.now().toString() };
      mockDb.exams.push(newExam);
      saveToStorage(mockDb);
      resolve(newExam);
    }, DELAY);
  });
};

/**
 * Updates an existing exam.
 */
export const updateExam = (updatedExam) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/exams/${updatedExam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedExam)
    }).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockDb.exams.findIndex(e => e.id === updatedExam.id);
      if (index !== -1) {
        mockDb.exams[index] = { ...updatedExam };
        saveToStorage(mockDb);
        resolve({ ...updatedExam });
      } else {
        reject(new Error("Exam not found"));
      }
    }, DELAY);
  });
};

/**
 * Deletes an exam by its ID.
 */
export const deleteExam = (id) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/exams/${id}`, {
      method: 'DELETE'
    }).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockDb.exams.findIndex(e => e.id === id);
      if (index !== -1) {
        mockDb.exams.splice(index, 1);
        saveToStorage(mockDb);
        resolve();
      } else {
        reject(new Error("Exam not found"));
      }
    }, DELAY);
  });
};

/**
 * Submits student answers for grading.
 */
export const submitExam = (examId, studentName, studentAnswers, studentId = null) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, studentName, answers: studentAnswers, studentId })
    }).then(handleResponse).then(data => data.score);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exam = mockDb.exams.find((e) => e.id === examId);
      if (!exam) {
        reject(new Error('Exam not found'));
        return;
      }

      const student = studentId 
        ? mockDb.users.find(u => u.id === studentId)
        : mockDb.users.find(u => u.name === studentName);

      if (student && exam.courseId) {
        student.enrolledCourses = student.enrolledCourses || [];
        if (!student.enrolledCourses.includes(exam.courseId)) {
          student.enrolledCourses.push(exam.courseId);
        }
      }

      const questions = exam.questions || [];
      if (!Array.isArray(questions) || questions.length === 0) {
        reject(new Error('Exam contains no questions'));
        return;
      }

      let totalScore = 0;

      questions.forEach((question, index) => {
        if (!question.type || question.type === 'multiple_choice') {
          const key = question.id || index;
          const expected = question.correctAnswers;
          const given = studentAnswers[key];

          if (Array.isArray(expected) && Array.isArray(given)) {
            const isCorrect = expected.length === given.length && expected.every(val => given.includes(val));
            if (isCorrect) {
              totalScore += question.points || 0;
            }
          }
        }
      });

      const score = Math.round(totalScore);

      mockDb.submissions = mockDb.submissions || [];
      mockDb.submissions.push({
        id: Date.now().toString(),
        studentName,
        examId,
        score,
        answers: studentAnswers,
        manualGrades: {},
        submittedAt: new Date().toISOString()
      });
      saveToStorage(mockDb);
      resolve(score);
    }, DELAY);
  });
};

/**
 * Retrieves student submissions.
 */
export const getStudentSubmissions = (studentName) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/submissions/student/${encodeURIComponent(studentName)}`).then(handleResponse);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
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
      resolve(results);
    }, DELAY);
  });
};

/**
 * Retrieves submissions associated with a specific exam.
 */
export const getExamSubmissions = (examId) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/submissions/exam/${examId}`).then(handleResponse);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const submissions = (mockDb.submissions || []).filter(s => s.examId === examId);
      resolve(submissions);
    }, DELAY);
  });
};

/**
 * Retrieves student submission for a given exam.
 */
export const getStudentSubmission = (examId, studentName) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/submissions/exam/${examId}/student/${encodeURIComponent(studentName)}`).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const submission = (mockDb.submissions || []).find(s => s.examId === examId && s.studentName === studentName);
      if (submission) {
        resolve({ ...submission });
      } else {
        reject(new Error("Submission not found"));
      }
    }, DELAY);
  });
};

/**
 * Retrieves submission by ID.
 */
export const getSubmissionById = (submissionId) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/submissions/${submissionId}`).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const submission = (mockDb.submissions || []).find(s => s.id === submissionId);
      if (submission) {
        resolve({ ...submission });
      } else {
        reject(new Error("Submission not found"));
      }
    }, DELAY);
  });
};

/**
 * Updates submission grade.
 */
export const updateSubmissionGrade = (submissionId, questionId, points, notes) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, points, notes })
    }).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const submission = mockDb.submissions.find(s => s.id === submissionId);
      if (!submission) {
        return reject(new Error("Submission not found"));
      }
      submission.manualGrades = submission.manualGrades || {};
      submission.manualGrades[questionId] = Number(points);

      submission.teacherNotes = submission.teacherNotes || {};
      submission.teacherNotes[questionId] = notes || "";

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

      saveToStorage(mockDb);
      resolve({ ...submission });
    }, DELAY);
  });
};

/**
 * Retrieves all courses.
 */
export const getAllCourses = () => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/courses`).then(handleResponse);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...(mockDb.courses || [])]);
    }, DELAY);
  });
};

/**
 * Retrieves courses taught by teacher.
 */
export const getCoursesByTeacher = (teacherId) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/courses/teacher/${teacherId}`).then(handleResponse);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const courses = (mockDb.courses || []).filter(c => c.teacherId === teacherId);
      resolve(courses);
    }, DELAY);
  });
};

/**
 * Creates a new course.
 */
export const createCourse = (courseName, courseCode, teacherId) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: courseName, code: courseCode, teacherId })
    }).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const codeExists = (mockDb.courses || []).some(c => c.code.toLowerCase() === courseCode.toLowerCase());
      if (codeExists) {
        return reject(new Error("Course code already exists"));
      }

      const newCourse = {
        id: "c" + Date.now(),
        name: courseName,
        code: courseCode,
        teacherId
      };

      mockDb.courses = mockDb.courses || [];
      mockDb.courses.push(newCourse);
      saveToStorage(mockDb);
      resolve(newCourse);
    }, DELAY);
  });
};

/**
 * Enrolls student in course.
 */
export const enrollStudentInCourse = (studentId, courseCode) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/courses/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, courseCode })
    }).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = (mockDb.courses || []).find(c => c.code.toLowerCase() === courseCode.toLowerCase());
      if (!course) {
        return reject(new Error("Course code not found"));
      }

      const userIndex = mockDb.users.findIndex(u => u.id === studentId);
      if (userIndex === -1) {
        return reject(new Error("User not found"));
      }

      const student = mockDb.users[userIndex];
      student.enrolledCourses = student.enrolledCourses || [];

      if (student.enrolledCourses.includes(course.id)) {
        return reject(new Error("Already enrolled in this course"));
      }

      student.enrolledCourses.push(course.id);
      saveToStorage(mockDb);
      resolve(course);
    }, DELAY);
  });
};

/**
 * Retrieves courses student is enrolled in.
 */
export const getStudentEnrolledCourses = (studentId) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/courses/student/${studentId}`).then(handleResponse);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const student = mockDb.users.find(u => u.id === studentId);
      if (!student) {
        return resolve([]);
      }
      const enrolledIds = student.enrolledCourses || [];
      const courses = (mockDb.courses || []).filter(c => enrolledIds.includes(c.id));
      resolve(courses);
    }, DELAY);
  });
};

/**
 * Unenrolls/removes student from course.
 */
export const unenrollStudentFromCourse = (studentId, courseId) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/courses/${courseId}/student/${studentId}`, {
      method: 'DELETE'
    }).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = mockDb.users.findIndex(u => u.id === studentId);
      if (userIndex === -1) {
        return reject(new Error("User not found"));
      }

      const student = mockDb.users[userIndex];
      student.enrolledCourses = student.enrolledCourses || [];

      const courseIndex = student.enrolledCourses.indexOf(courseId);
      if (courseIndex === -1) {
        return reject(new Error("You are not enrolled in this course"));
      }

      student.enrolledCourses.splice(courseIndex, 1);
      saveToStorage(mockDb);
      resolve();
    }, DELAY);
  });
};

/**
 * Deletes course.
 */
export const deleteCourse = (courseId) => {
  if (config.USE_SERVER_API) {
    return fetch(`${BASE_URL}/courses/${courseId}`, {
      method: 'DELETE'
    }).then(handleResponse);
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const courseIndex = (mockDb.courses || []).findIndex(c => c.id === courseId);
      if (courseIndex === -1) {
        return reject(new Error("Course not found"));
      }

      mockDb.courses.splice(courseIndex, 1);

      if (mockDb.exams) {
        mockDb.exams = mockDb.exams.filter(e => e.courseId !== courseId);
      }

      if (mockDb.users) {
        mockDb.users.forEach(u => {
          if (u.enrolledCourses) {
            u.enrolledCourses = u.enrolledCourses.filter(cid => cid !== courseId);
          }
        });
      }

      saveToStorage(mockDb);
      resolve();
    }, DELAY);
  });
};
