import React, { useState } from 'react';
import TeacherDashboard from './TeacherDashboard';
import StudentPortal from './StudentPortal';

function App() {
  const [role, setRole] = useState('teacher'); // 'teacher' or 'student'

  const toggleRole = () => {
    setRole(prevRole => (prevRole === 'teacher' ? 'student' : 'teacher'));
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="navbar navbar-dark bg-dark">
        <div className="container py-3">
          <span className="navbar-brand mb-0 h1">E-Test System</span>
          <button className="btn btn-outline-light" onClick={toggleRole}>
            Switch to {role === 'teacher' ? 'Student' : 'Teacher'} View
          </button>
        </div>
      </header>

      <main className="flex-grow-1 container">
        {role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentPortal />
        )}
      </main>

      <footer className="border-top py-3 text-center text-muted">
        <div className="container">
          &copy; 2026 E-Test System - Prepared for Node.js Backend
        </div>
      </footer>
    </div>
  );
}

export default App;
