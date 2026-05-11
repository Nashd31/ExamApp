import React, { useState } from 'react';
import TeacherDashboard from './TeacherDashboard';
import StudentPortal from './StudentPortal';

function App() {
  const [role, setRole] = useState('teacher'); // 'teacher' or 'student'

  const toggleRole = () => {
    setRole(prevRole => (prevRole === 'teacher' ? 'student' : 'teacher'));
  };

  return (
    <div className="App">
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand mb-0 h1">E-Test System</span>
          <button className="btn btn-outline-light" onClick={toggleRole}>
            Switch to {role === 'teacher' ? 'Student' : 'Teacher'} View
          </button>
        </div>
      </nav>

      <main>
        {role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentPortal />
        )}
      </main>

      <footer className="mt-5 py-3 text-center text-muted border-top">
        <div className="container">
          &copy; 2026 E-Test System - Prepared for Node.js Backend
        </div>
      </footer>
    </div>
  );
}

export default App;
