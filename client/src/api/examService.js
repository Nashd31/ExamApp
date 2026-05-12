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
