import mockDb, { saveToStorage } from './mockDb';
import config from '../services/config';

const DELAY = config.MOCK_API_DELAY;

/**
 * Retrieves all exams from the mock database.
 * Simulates a network request delay before resolving the promise.
 */
export const getAllExams = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockDb.exams]);
    }, DELAY);
  });
};

/**
 * Retrieves a specific exam by its ID.
 * Resolves with a copy of the exam object if found, otherwise rejects with an error.
 */
export const getExamById = (id) => {
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
 * Creates a new exam and adds it to the mock database.
 * Generates a unique ID based on the current timestamp, removes the 'isNew' flag,
 * and persists the updated database to local storage.
 */
export const createExam = (exam) => {
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
 * Updates an existing exam in the mock database.
 * Locates the exam by its ID, updates its data in place, and persists the changes.
 * Rejects if the exam cannot be found.
 */
export const updateExam = (updatedExam) => {
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
 * Deletes an exam from the mock database by its ID.
 * Removes the exam from the array and persists the changes to storage.
 */
export const deleteExam = (id) => {
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
 * Submits a student's answers for grading and records the submission.
 * Validates the existence of the exam and its questions. Calculates the score
 * by comparing student answers against expected answers for 'multiple_choice' questions.
 * Open-ended questions are currently excluded from automatic grading.
 * Generates a submission record and saves it to local storage.
 */
export const submitExam = (examId, studentName, studentAnswers, studentId = null) => {
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

      // Calculate grade using point values
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
 * Retrieves all submissions made by a specific student.
 * Maps over raw submissions to fetch the corresponding exam title and pass grade,
 * yielding an array of structured result objects.
 */
export const getStudentSubmissions = (studentName) => {
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
 * Retrieves all submissions associated with a specific exam.
 * Used primarily by teachers to review class performance on a particular exam.
 */
export const getExamSubmissions = (examId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const submissions = (mockDb.submissions || []).filter(s => s.examId === examId);
      resolve(submissions);
    }, DELAY);
  });
};

/**
 * Retrieves a specific submission record for a given exam and student name.
 * Useful for reviewing individual answers submitted by a student.
 */
export const getStudentSubmission = (examId, studentName) => {
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

export const getSubmissionById = (submissionId) => {
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

export const updateSubmissionGrade = (submissionId, questionId, points, notes) => {
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
 * Retrieves all courses in the mock database.
 */
export const getAllCourses = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...(mockDb.courses || [])]);
    }, DELAY);
  });
};

/**
 * Retrieves courses taught by a specific teacher.
 */
export const getCoursesByTeacher = (teacherId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const courses = (mockDb.courses || []).filter(c => c.teacherId === teacherId);
      resolve(courses);
    }, DELAY);
  });
};

/**
 * Creates a new course in the mock database.
 */
export const createCourse = (courseName, courseCode, teacherId) => {
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
 * Enrolls a student in a course by its course code.
 */
export const enrollStudentInCourse = (studentId, courseCode) => {
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
 * Retrieves courses a specific student is enrolled in.
 */
export const getStudentEnrolledCourses = (studentId) => {
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
 * Unenrolls/removes a student from a course by its course ID.
 */
export const unenrollStudentFromCourse = (studentId, courseId) => {
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
 * Deletes a course from the mock database by its ID.
 * Also removes all exams associated with this course,
 * and clears student enrollments for this course.
 */
export const deleteCourse = (courseId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const courseIndex = (mockDb.courses || []).findIndex(c => c.id === courseId);
      if (courseIndex === -1) {
        return reject(new Error("Course not found"));
      }

      // Remove the course
      mockDb.courses.splice(courseIndex, 1);

      // Remove all exams associated with this course
      if (mockDb.exams) {
        mockDb.exams = mockDb.exams.filter(e => e.courseId !== courseId);
      }

      // Clean up student enrollments
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

