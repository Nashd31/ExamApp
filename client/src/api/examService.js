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
      const { isNew, ...examData } = exam;
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
export const submitExam = (examId, studentName, studentAnswers) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exam = mockDb.exams.find((e) => e.id === examId);
      if (!exam) {
        reject(new Error('Exam not found'));
        return;
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
      mockDb.submissions.push({ id: Date.now().toString(), studentName, examId, score, answers: studentAnswers, manualGrades: {} });
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
          areGradesPublished: exam.areGradesPublished !== false
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

export const updateSubmissionGrade = (submissionId, questionId, points) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const submission = mockDb.submissions.find(s => s.id === submissionId);
      if (!submission) {
        return reject(new Error("Submission not found"));
      }
      submission.manualGrades = submission.manualGrades || {};
      submission.manualGrades[questionId] = Number(points);

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

