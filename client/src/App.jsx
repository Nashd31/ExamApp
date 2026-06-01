import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPortal from './pages/StudentPortal';
import TakeExam from './pages/TakeExam';
import ReviewExam from './pages/ReviewExam';
import GradeSubmission from './pages/GradeSubmission';
import ExamScores from './pages/ExamScores';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';


// Renders the landing page content with a welcome message and basic instructions.
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

/**
 * The main Application component.
 * Configures React Router, sets up global context providers (AuthProvider),
 * and defines the main layout and route mapping for the application.
 */
function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <AuthProvider>
        <div style={appStyle}>
          <header style={headerStyle}>
            <Navbar />
          </header>

          <div id="main-scroll-container" style={contentWrapperStyle}>
            <main style={mainStyle}>
              <div className="container py-3">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/teacher"
                    element={
                      <ProtectedRoute allowedRole="teacher">
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/exam/:examId/scores"
                    element={
                      <ProtectedRoute allowedRole="teacher">
                        <ExamScores />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/grade/:submissionId"
                    element={
                      <ProtectedRoute allowedRole="teacher">
                        <GradeSubmission />
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
                  <Route
                    path="/take-exam/:id"
                    element={
                      <ProtectedRoute allowedRole="student">
                        <TakeExam />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/review-exam/:id"
                    element={
                      <ProtectedRoute allowedRole="student">
                        <ReviewExam />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/review-exam/:id/:studentName"
                    element={
                      <ProtectedRoute allowedRole="teacher">
                        <ReviewExam />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </main>

            <footer className="border-top py-3 text-center text-muted bg-dark text-white">
              <div className="container text-white">
                &copy; 2026 E-Test System - Prepared for Node.js Backend
              </div>
            </footer>
          </div>
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
  flexShrink: 0,
  borderBottom: '1px solid #ddd',
};

const contentWrapperStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarGutter: 'stable',
};

const mainStyle = {
  minHeight: '100%',
  paddingTop: '1rem',
  paddingBottom: '1rem',
  background: 'linear-gradient(135deg, #eef2ff, #c7d2fe)',
};
