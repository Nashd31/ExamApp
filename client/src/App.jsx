import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPortal from './pages/StudentPortal';
import TakeExam from './pages/TakeExam';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import Auth from './pages/Auth';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

/**
 * Layout content component that has access to React Router's location context.
 * Conditionally hides the footer on exam-taking pages.
 */
const AppContent = () => {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/take-exam');

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        <Navbar />
      </header>

      <div id="main-scroll-container" style={contentWrapperStyle}>
        <main style={mainStyle}>
          <div className="container-fluid py-3 px-4" style={{ maxWidth: '1400px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
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
          <footer className="border-top py-3 text-center bg-dark text-white">
            <div className="container d-flex justify-content-center align-items-center gap-2 flex-wrap">
              <span className="opacity-75">&copy; 2026 E-Test System -</span>
              <Link to="/privacy-policy" className="footer-link">
                Privacy Policy
              </Link>
              <span className="text-white opacity-25">|</span>
              <Link to="/terms-and-conditions" className="footer-link">
                Terms & Conditions
              </Link>
            </div>
          </footer>
        )}
      </div>
    </div >
  );
}

/**
 * The main Application component.
 * Configures React Router, sets up global context providers (AuthProvider, DialogProvider),
 * and defines the main layout and route mapping for the application.
 */
const App = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <AuthProvider>
        <DialogProvider>
          <AppContent />
        </DialogProvider>
      </AuthProvider>
    </HashRouter>
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
