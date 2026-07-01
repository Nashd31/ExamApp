import { logError } from '../services/logger.js';

/**
 * Attempts to load the mock database from localStorage.
 * Parses the JSON string and applies default fallback values for exam properties.
 * If no data is found or an error occurs during parsing, returns null.
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('examApp_mockDb');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.exams) {
        // Migration: If any exam contains string IDs like "c1", clear cache to load clean integer schema
        const hasOldSchema = parsed.exams.some(e => typeof e.id === 'string' && e.id.startsWith('c') || e.courseId === 'c1') || parsed.exams.length < 5;
        if (hasOldSchema) {
          localStorage.removeItem('examApp_mockDb');
          return null;
        }

        // Ensure default values exist for exams loaded from older formats
        parsed.exams = parsed.exams.map((e, idx) => ({
          ...e,
          id: Number(e.id) || (idx + 1),
          duration: e.duration || 60,
          passGrade: e.passGrade || 50,
          areGradesPublished: e.areGradesPublished !== undefined ? e.areGradesPublished : false,
          courseId: Number(e.courseId) || (idx === 0 ? 1 : idx === 1 ? 2 : 3),
          questions: (e.questions || []).map((q, qidx) => ({
            ...q,
            id: Number(q.id) || (qidx + 1),
            allowMultipleAnswers: q.allowMultipleAnswers !== undefined ? q.allowMultipleAnswers : false,
            correctAnswers: Array.isArray(q.correctAnswers)
              ? q.correctAnswers
              : (q.answer !== undefined ? [q.answer] : [0])
          }))
        }));

        // Migrate courses if they are missing
        if (!parsed.courses) {
          parsed.courses = [
            { id: 1, name: "Web Development Essentials", code: "CS-101", teacherId: 1 },
            { id: 2, name: "Frontend Development with React", code: "CS-102", teacherId: 1 },
            { id: 3, name: "Backend Development with Node & Express", code: "CS-103", teacherId: 1 }
          ];
        }

        // Migrate student enrollments if they are missing
        if (parsed.users) {
          parsed.users = parsed.users.map(u => {
            if (u.role === 'student' && !u.enrolledCourses) {
              return {
                ...u,
                enrolledCourses: [1, 2, 3]
              };
            }
            return u;
          });
        }
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
  courses: [
    { id: 1, name: "Web Development Essentials", code: "CS-101", teacherId: 1 },
    { id: 2, name: "Frontend Development with React", code: "CS-102", teacherId: 1 },
    { id: 3, name: "Backend Development with Node & Express", code: "CS-103", teacherId: 1 }
  ],
  exams: [
    {
      id: 1,
      title: "HTML & CSS Basics",
      courseId: 1,
      startDate: "2026-05-01T10:00:00.000Z",
      endDate: "2026-05-01T12:00:00.000Z",
      areGradesPublished: true,
      duration: 45,
      passGrade: 60,
      questions: [
        { id: 1, type: "multiple_choice", text: "What does HTML stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "HyperTabular Mail Link"], allowMultipleAnswers: false, correctAnswers: [0], points: 33 },
        { id: 2, type: "multiple_choice", text: "Which HTML tag is used to define an internal style sheet?", options: ["<css>", "<script>", "<style>"], allowMultipleAnswers: false, correctAnswers: [2], points: 33 },
        { id: 3, type: "open_ended", text: "Explain the difference between block and inline HTML elements.", points: 34 }
      ]
    },
    {
      id: 2,
      title: "React State Management",
      courseId: 2,
      startDate: "2026-06-01T10:00:00.000Z",
      endDate: "2026-06-01T12:00:00.000Z",
      areGradesPublished: false,
      duration: 90,
      passGrade: 55,
      questions: [
        { id: 4, type: "multiple_choice", text: "What is a Hook in React?", options: ["A function that lets you hook into React state and lifecycle", "A way to link external stylesheets", "A HTML element selector"], allowMultipleAnswers: false, correctAnswers: [0], points: 50 },
        { id: 5, type: "multiple_choice", text: "Which hook is used to handle side effects in React?", options: ["useState", "useEffect", "useContext"], allowMultipleAnswers: false, correctAnswers: [1], points: 50 }
      ]
    },
    {
      id: 3,
      title: "Node.js Core Concepts",
      courseId: 3,
      startDate: "2026-07-01T10:00:00.000Z",
      endDate: "2026-07-01T12:00:00.000Z",
      areGradesPublished: false,
      duration: 60,
      passGrade: 50,
      questions: [
        { id: 6, type: "multiple_choice", text: "Which module is used to create a web server in Node?", options: ["http", "fs", "path"], allowMultipleAnswers: false, correctAnswers: [0], points: 50 },
        { id: 7, type: "multiple_choice", text: "What is the command to initialize a new npm package?", options: ["npm start", "npm init", "npm install"], allowMultipleAnswers: false, correctAnswers: [1], points: 50 }
      ]
    },
    {
      id: 4,
      title: "JavaScript Fundamentals",
      courseId: 1,
      startDate: "2026-07-01T00:00:00.000Z",
      endDate: "2026-07-02T23:59:59.000Z",
      areGradesPublished: false,
      duration: 120,
      passGrade: 60,
      questions: [
        { id: 8, type: "multiple_choice", text: "Which of the following are valid variable declarations in JavaScript? (Select all that apply)", options: ["var", "let", "const", "def"], allowMultipleAnswers: true, correctAnswers: [0, 1, 2], points: 30 },
        { id: 9, type: "multiple_choice", text: "What is the correct way to write a conditional block in JS?", options: ["if i = 5 then", "if (i === 5)", "if i == 5"], allowMultipleAnswers: false, correctAnswers: [1], points: 30 },
        { id: 10, type: "open_ended", text: "Explain what a closure is in JavaScript and provide a brief example.", points: 40 }
      ]
    },
    {
      id: 5,
      title: "Database Integration & SQL",
      courseId: 3,
      startDate: "2026-08-01T10:00:00.000Z",
      endDate: "2026-08-01T12:00:00.000Z",
      areGradesPublished: false,
      duration: 60,
      passGrade: 70,
      questions: [
        { id: 11, type: "multiple_choice", text: "What does SQL stand for?", options: ["Structured Query Language", "Simple Queue List", "System Query Link"], allowMultipleAnswers: false, correctAnswers: [0], points: 100 }
      ]
    }
  ],
  users: [
    {
      id: 1,
      email: "teacher@test.com",
      password: "password",
      name: "Test Teacher",
      role: "teacher"
    },
    {
      id: 2,
      email: "student@test.com",
      password: "password",
      name: "Test Student",
      role: "student",
      enrolledCourses: [1, 2, 3]
    },
    {
      id: 3,
      email: "john@test.com",
      password: "password",
      name: "John Doe",
      role: "student",
      enrolledCourses: [1, 2, 3]
    }
  ],
  submissions: [
    {
      id: 1,
      studentName: "Test Student",
      studentId: 2,
      examId: 1,
      score: 58,
      status: "graded",
      answers: {
        1: [0],
        2: [1],
        3: "var is function-scoped while let and const are block-scoped."
      },
      manualGrades: {
        3: 25
      },
      teacherNotes: {
        3: "Good explanation of scope, but you forgot to mention variable hoisting differences."
      },
      submittedAt: "2026-05-01T10:45:00.000Z"
    },
    {
      id: 2,
      studentName: "John Doe",
      studentId: 3,
      examId: 1,
      score: 100,
      status: "graded",
      answers: {
        1: [0],
        2: [2],
        3: "Block elements take up the full width, inline elements only take as much width as necessary."
      },
      manualGrades: {
        3: 34
      },
      teacherNotes: {
        3: "Excellent explanation of block vs inline layout rules."
      },
      submittedAt: "2026-05-01T11:15:00.000Z"
    },
    {
      id: 3,
      studentName: "Test Student",
      studentId: 2,
      examId: 2,
      score: 50,
      status: "submitted",
      answers: {
        4: [0],
        5: [0]
      },
      manualGrades: {},
      submittedAt: "2026-06-01T11:00:00.000Z"
    }
  ]
};

const mockDb = loadFromStorage() || defaultData;
if (!localStorage.getItem('examApp_mockDb')) {
  saveToStorage(mockDb);
}

export default mockDb;
