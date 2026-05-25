import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPortal from './pages/StudentPortal';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

const Home = () => (
  <div className="text-center py-5">
    <h1 className="display-4">Welcome to E-Test System</h1>
    <p className="lead">
      A comprehensive platform for creating, managing, and taking exams.
    </p>
    <div className="mt-4">
      <p>Use the navigation menu above to access:</p>
      <ul className="list-unstyled">
        <li className="mb-2">
          <strong>Teacher Dashboard</strong> - Create and manage exams
        </li>
        <li className="mb-2">
          <strong>Student Portal</strong> - Take exams and view results
        </li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <div style={appStyle}>
          <header style={headerStyle}>
            <Navbar />
          </header>

          <main style={mainStyle}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRole="student">
                    <StudentPortal />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <footer className="border-top py-3 text-center text-muted">
            <div className="container">
              &copy; 2026 E-Test System - Prepared for Node.js Backend
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


/* ---------- STYLES ---------- */

const appStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
};

const headerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  background: 'white',
  flexShrink: 0,
  borderBottom: '1px solid #ddd',
};

const mainStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingTop: '1rem',
  paddingBottom: '1rem',
  scrollbarGutter: 'stable',
};
