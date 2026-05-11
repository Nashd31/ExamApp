import mockDb from './mockDb';

const DELAY = 500;

// מתודה המדגימה קריאה לשרת לקבלת כל המבחנים
export const getAllExams = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockDb.exams]);
    }, DELAY);
  });
};

// מתודה המדגימה קריאה לשרת לקבלת מבחן לפי מזהה
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

// מתודה המדגימה קריאה לשרת ליצירת מבחן חדש
export const createExam = (exam) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExam = { ...exam, id: Date.now().toString() };
      mockDb.exams.push(newExam);
      resolve(newExam);
    }, DELAY);
  });
};
