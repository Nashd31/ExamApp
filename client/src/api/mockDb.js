import { logError } from '../services/logger.js';

/**
 * Attempts to load the mock database from localStorage.
 * Parses the JSON string and applies default fallback values for exam properties (e.g. duration, passGrade).
 * If no data is found or an error occurs during parsing, returns null.
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('examApp_mockDb');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.exams) {
        // Migration: If any exam contains isPublished (old schema), clear cache to load defaultData
        const hasOldSchema = parsed.exams.some(e => 'isPublished' in e);
        if (hasOldSchema) {
          localStorage.removeItem('examApp_mockDb');
          return null;
        }

        // Ensure default values exist for exams loaded from older formats
        parsed.exams = parsed.exams.map(e => ({
          ...e,
          duration: e.duration || 60,
          passGrade: e.passGrade || 50,
          areGradesPublished: e.areGradesPublished !== undefined ? e.areGradesPublished : false,
          questions: (e.questions || []).map(q => ({
            ...q,
            allowMultipleAnswers: q.allowMultipleAnswers !== undefined ? q.allowMultipleAnswers : false,
            correctAnswers: Array.isArray(q.correctAnswers)
              ? q.correctAnswers
              : (q.answer !== undefined ? [q.answer] : [0])
          }))
        }));
      }
      return parsed;
    }
    return null;
  } catch (error) {
    logError('Error loading from localStorage:', error.message || error);
    return null;
  }
};

/**
 * Persists the provided mock database state into localStorage.
 * Serializes the object into a JSON string under the key 'examApp_mockDb'.
 */
export const saveToStorage = (data) => {
  try {
    localStorage.setItem('examApp_mockDb', JSON.stringify(data));
  } catch (error) {
    logError('Error saving to localStorage:', error.message || error);
  }
};

const defaultData = {
  exams: [
    {
      id: "1",
      title: "JavaScript Basics",
      startDate: "2026-05-01T10:00:00.000Z",
      endDate: "2026-05-01T12:00:00.000Z",
      areGradesPublished: false,
      duration: 45,
      passGrade: 60,
      questions: [
        { id: "q1", type: "multiple_choice", text: "What is a closure?", options: ["A function", "A variable", "A loop"], allowMultipleAnswers: false, correctAnswers: [0], points: 33 },
        { id: "q2", type: "multiple_choice", text: "What is 'NaN'?", options: ["Not a Number", "Now and Next", "New and Null"], allowMultipleAnswers: false, correctAnswers: [0], points: 33 },
        { id: "q5", type: "open_ended", text: "Explain the difference between let, const, and var.", points: 34 }
      ]
    },
    {
      id: "2",
      title: "React Fundamentals",
      startDate: "2026-06-01T10:00:00.000Z",
      endDate: "2026-06-01T20:00:00.000Z",
      areGradesPublished: false,
      duration: 90,
      passGrade: 55,
      questions: [
        { id: "q3", type: "multiple_choice", text: "What is a Hook?", options: ["A React feature", "A CSS selector", "A HTML tag"], allowMultipleAnswers: false, correctAnswers: [0], points: 50 },
        { id: "q4", type: "multiple_choice", text: "What is JSX?", options: ["Syntax extension", "JavaScript XML", "Both"], allowMultipleAnswers: false, correctAnswers: [2], points: 50 }
      ]
    },
    {
      id: "3",
      title: "Node.js Basics",
      startDate: "2026-07-01T10:00:00.000Z",
      endDate: "2026-07-01T12:00:00.000Z",
      areGradesPublished: false,
      duration: 60,
      passGrade: 50,
      questions: [
        { id: "q6", type: "multiple_choice", text: "What module is used to serve web pages in Node?", options: ["http", "fs", "path"], allowMultipleAnswers: false, correctAnswers: [0], points: 50 },
        { id: "q7", type: "multiple_choice", text: "What command initializes npm project?", options: ["npm start", "npm init", "npm install"], allowMultipleAnswers: false, correctAnswers: [1], points: 50 }
      ]
    }
  ],
  users: [
    {
      id: "u1",
      email: "teacher@test.com",
      password: "123",
      name: "Test Teacher",
      role: "teacher"
    },
    {
      id: "u2",
      email: "student@test.com",
      password: "123",
      name: "Test Student",
      role: "student"
    },
    {
      id: "u3",
      email: "john@test.com",
      password: "123",
      name: "John Doe",
      role: "student"
    }
  ],
  submissions: [
    {
      id: "sub1",
      studentName: "Test Student",
      examId: "1",
      score: 50,
      answers: {
        q1: [0],
        q2: [1],
        q5: "var is function-scoped while let and const are block-scoped."
      },
      manualGrades: {},
      submittedAt: "2026-05-01T10:45:00.000Z"
    },
    {
      id: "sub2",
      studentName: "John Doe",
      examId: "1",
      score: 100,
      answers: {
        q1: [0],
        q2: [0],
        q5: "They are different variable declarations."
      },
      manualGrades: {},
      submittedAt: "2026-05-01T11:15:00.000Z"
    }
  ]
};

const mockDb = loadFromStorage() || defaultData;

export default mockDb;
