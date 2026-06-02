import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPortal from './pages/StudentPortal';
import TakeExam from './pages/TakeExam';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { AuthProvider } from './context/AuthContext';
import Auth from './pages/Auth';
import Home from './pages/Home';

/**
 * Layout content component that has access to React Router's location context.
 * Conditionally hides the footer on exam-taking pages.
 */
function AppContent() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/take-exam');

  return (
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
                    <Auth />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Auth />
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
            </Routes>
          </div>
        </main>

        {!hideFooter && (
          <footer className="border-top py-3 text-center text-muted bg-dark text-white">
            <div className="container text-white">
              &copy; 2026 E-Test System - Prepared for Node.js Backend
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

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
        <AppContent />
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
