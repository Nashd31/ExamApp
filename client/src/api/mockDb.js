// זה מידע זמני לשם הדגמה

// Load data from localStorage if available, otherwise use defaults
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('examApp_mockDb');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

// Save data to localStorage
export const saveToStorage = (data) => {
  try {
    localStorage.setItem('examApp_mockDb', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const defaultData = {
  exams: [
    {
      id: "1",
      title: "JavaScript Basics",
      questions: [
        { id: "q1", text: "What is a closure?", options: ["A function", "A variable", "A loop"], answer: 0 },
        { id: "q2", text: "What is 'NaN'?", options: ["Not a Number", "Now and Next", "New and Null"], answer: 0 }
      ]
    },
    {
      id: "2",
      title: "React Fundamentals",
      questions: [
        { id: "q3", text: "What is a Hook?", options: ["A React feature", "A CSS selector", "A HTML tag"], answer: 0 },
        { id: "q4", text: "What is JSX?", options: ["Syntax extension", "JavaScript XML", "Both"], answer: 2 }
      ]
    }
  ],
  studentScores: [
    { studentName: "John Doe", examId: "1", score: 80 },
    { studentName: "Jane Smith", examId: "2", score: 95 }
  ]
};

const mockDb = loadFromStorage() || defaultData;

export default mockDb;
