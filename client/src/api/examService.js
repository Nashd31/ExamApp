import mockDb, { saveToStorage } from './mockDb';

const DELAY = 500;

export const getAllExams = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockDb.exams]);
    }, DELAY);
  });
};

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

export const updateExam = (updatedExam) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockDb.exams.findIndex(e => e.id === updatedExam.id);
      if (index !== -1) {
        mockDb.exams[index] = { ...updatedExam };
        saveToStorage(mockDb);
        console.log('mockDb updated with exam:', mockDb.exams[index]);
        resolve({ ...updatedExam });
      } else {
        reject(new Error("Exam not found"));
      }
    }, DELAY);
  });
};

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

      let correctCount = 0;
      let gradableCount = 0;
      questions.forEach((question, index) => {
        if (!question.type || question.type === 'multiple_choice') {
          gradableCount += 1;
          const key = question.id || index;
          const expected = question.answer;
          const given = studentAnswers[key];
          if (typeof given === 'number' && given === expected) {
            correctCount += 1;
          }
        }
      });

      const score = gradableCount > 0 ? Math.round((correctCount / gradableCount) * 100) : 0;
      mockDb.submissions = mockDb.submissions || [];
      mockDb.submissions.push({ id: Date.now().toString(), studentName, examId, score, answers: studentAnswers });
      saveToStorage(mockDb);
      resolve(score);
    }, DELAY);
  });
};

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
          passGrade: exam.passGrade || 50
        };
      });
      resolve(results);
    }, DELAY);
  });
};

export const getExamSubmissions = (examId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const submissions = (mockDb.submissions || []).filter(s => s.examId === examId);
      resolve(submissions);
    }, DELAY);
  });
};

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
