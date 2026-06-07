import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
  * Home page component.
  * Provides a comprehensive landing page for the E-Test platform.
  * Features a modern hero section, detailed SVG graphics, feature highlights,
  * dynamic activity counters, portal directions, and FAQs.
  */
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="home-page-container">
      {/* CSS Styles for animations & premium styling */}
      <style>{`
        .home-page-container {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-section {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }
        .portal-card {
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          border: 1px solid rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.65) !important;
          backdrop-filter: blur(10px);
        }
        .portal-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08) !important;
          border-color: #5b7cfa !important;
        }
        .feature-card {
          transition: all 0.3s ease;
          border-radius: 16px;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(91, 124, 250, 0.15) !important;
        }
        .stat-card {
          background: linear-gradient(135deg, #1e3a5f, #2d558a);
          color: white;
          border-radius: 16px;
          border: none;
        }
        .bullet-item::before {
          content: "✓";
          color: #5b7cfa;
          font-weight: bold;
          display: inline-block;
          width: 1.5em;
          margin-left: -1.5em;
        }
        .svg-glow {
          filter: drop-shadow(0px 8px 16px rgba(91, 124, 250, 0.25));
        }
      `}</style>

      {/* Hero Section */}
      <div className="hero-section rounded-4 p-5 mb-5 shadow-sm">
        <div className="row align-items-center g-5">
          <div className="col-lg-7 text-start">
            <span className="badge bg-primary px-3 py-2 rounded-pill mb-3 text-uppercase fs-6 fw-semibold tracking-wider">
              Smart Examination Platform
            </span>
            <h1 className="display-4 fw-bold text-dark mb-3 lh-sm">
              Empower Learning with <span className="text-primary">E-Test System</span>
            </h1>
            <p className="lead text-muted mb-4 fs-5">
              An intuitive, secure, and professional platform designed for academic environments. 
              Author robust assessments, monitor timed examinations, and generate instant analytical grade sheets.
            </p>
            <div className="d-flex gap-3 flex-wrap">
              {user ? (
                <>
                  {user.role === 'teacher' ? (
                    <button 
                      onClick={() => navigate('/teacher')} 
                      className="btn btn-primary btn-lg px-4 py-3 rounded-3 shadow"
                    >
                      Go to Teacher Dashboard &rarr;
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate('/student')} 
                      className="btn btn-primary btn-lg px-4 py-3 rounded-3 shadow"
                    >
                      Go to Student Portal &rarr;
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="btn btn-primary btn-lg px-4 py-3 rounded-3 shadow"
                  >
                    Get Started Now
                  </button>
                  <button 
                    onClick={() => navigate('/register')} 
                    className="btn btn-outline-primary btn-lg px-4 py-3 rounded-3"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="col-lg-5 text-center d-none d-lg-block">
            {/* Custom SVG Illustration */}
            <svg viewBox="0 0 400 400" width="100%" height="320px" className="svg-glow">
              <defs>
                <linearGradient id="rectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
                <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5b7cfa" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              
              {/* Background circular glowing orb */}
              <circle cx="200" cy="200" r="140" fill="url(#accentGrad)" opacity="0.06" />
              <circle cx="200" cy="200" r="90" fill="url(#accentGrad)" opacity="0.08" />

              {/* Main Clipboard Body */}
              <rect x="110" y="80" width="180" height="240" rx="16" fill="url(#rectGrad)" stroke="#e2e8f0" strokeWidth="4" />
              
              {/* Clipboard Header Clip */}
              <rect x="160" y="60" width="80" height="30" rx="8" fill="#1e3a5f" />
              <circle cx="200" cy="75" r="4" fill="#ffffff" />

              {/* Exam title lines */}
              <rect x="140" y="125" width="120" height="12" rx="4" fill="#5b7cfa" opacity="0.8" />
              
              {/* Question Checklist rows */}
              {/* Question 1: Checkbox checked */}
              <rect x="140" y="165" width="16" height="16" rx="4" fill="#10b981" />
              <path d="M144 173 l3 3 l5 -5" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="168" y="169" width="90" height="8" rx="3" fill="#94a3b8" />

              {/* Question 2: Checkbox checked */}
              <rect x="140" y="205" width="16" height="16" rx="4" fill="#10b981" />
              <path d="M144 213 l3 3 l5 -5" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="168" y="209" width="75" height="8" rx="3" fill="#94a3b8" />

              {/* Question 3: Checkbox pending/empty */}
              <rect x="140" y="245" width="16" height="16" rx="4" fill="none" stroke="#64748b" strokeWidth="2" />
              <rect x="168" y="249" width="85" height="8" rx="3" fill="#cbd5e1" />

              {/* Floating Timer Icon representing timing */}
              <g transform="translate(280, 260)">
                <circle cx="25" cy="25" r="25" fill="#ffffff" stroke="#e2e8f0" strokeWidth="3" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
                <circle cx="25" cy="25" r="20" fill="none" stroke="#5b7cfa" strokeWidth="3" />
                <line x1="25" y1="25" x2="25" y2="13" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
                <line x1="25" y1="25" x2="35" y2="25" stroke="#5b7cfa" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="22" y="2" width="6" height="3" fill="#1e3a5f" rx="1" />
              </g>

              {/* Floating Graduation Cap Icon */}
              <g transform="translate(60, 100)">
                <circle cx="25" cy="25" r="25" fill="#ffffff" stroke="#e2e8f0" strokeWidth="3" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
                <path d="M13 23 l12 -6 l12 6 l-12 6 z" fill="#1e3a5f" />
                <path d="M18 25.5 v4 c0 2 2 3.5 7 3.5 s7 -1.5 7 -3.5 v-4" fill="#1e3a5f" />
                <path d="M33 22 v8" fill="none" stroke="#5b7cfa" strokeWidth="1.5" />
                <circle cx="33" cy="30" r="1.5" fill="#5b7cfa" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Role Access Portals Section */}
      <h3 className="text-center fw-bold text-dark mb-4 mt-5">Select Your Portal</h3>
      <div className="row g-4 mb-5 justify-content-center">
        {/* Student Portal Card */}
        <div className="col-md-5">
          <div className="card portal-card h-100 shadow-sm rounded-4 text-start p-4">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 rounded-4 bg-light me-3 text-primary" style={{ border: '1px solid #eef2ff' }}>
                {/* Student SVG Icon */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h4 className="fw-bold text-dark m-0">Student Portal</h4>
            </div>
            <p className="text-muted mb-4">
              Enter your designated exam ID, launch your test sessions with active timer tracking, and view score results.
            </p>
            <ul className="list-unstyled mb-4 ps-3">
              <li className="mb-2 bullet-item">Search and register for scheduled exams</li>
              <li className="mb-2 bullet-item">Interactive exam workspace with time limit indicators</li>
              <li className="mb-2 bullet-item">Instant grades for multiple choice questions</li>
              <li className="mb-2 bullet-item">Full submission review containing correct/incorrect answers</li>
            </ul>
            <button 
              onClick={() => navigate('/student')} 
              className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold mt-auto"
            >
              Enter Student Portal &rarr;
            </button>
          </div>
        </div>

        {/* Teacher Portal Card */}
        <div className="col-md-5">
          <div className="card portal-card h-100 shadow-sm rounded-4 text-start p-4">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 rounded-4 bg-light me-3 text-success" style={{ border: '1px solid #eef2ff' }}>
                {/* Teacher SVG Icon */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4 className="fw-bold text-dark m-0">Teacher Dashboard</h4>
            </div>
            <p className="text-muted mb-4">
              Design complete multiple-choice and open-ended exams, review class scores, manually grade student work, and publish grades.
            </p>
            <ul className="list-unstyled mb-4 ps-3">
              <li className="mb-2 bullet-item">Create and configure dynamic questions and options</li>
              <li className="mb-2 bullet-item">Control exam time availability and durations</li>
              <li className="mb-2 bullet-item">Advanced visual performance charts (line & donut charts)</li>
              <li className="mb-2 bullet-item">Evaluate open-ended answers and update scores</li>
            </ul>
            <button 
              onClick={() => navigate('/teacher')} 
              className="btn btn-outline-primary w-100 py-2.5 rounded-3 fw-bold mt-auto"
            >
              Enter Teacher Dashboard &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Core Platform Features */}
      <div className="my-5 py-3">
        <h3 className="text-center fw-bold text-dark mb-4">Platform Highlights</h3>
        <div className="row g-4">
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 border-0 bg-white shadow-sm p-4 text-center feature-card">
              <div className="text-primary mb-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h6 className="fw-bold mb-2">Secure & Protected</h6>
              <p className="text-muted small mb-0">Role-based guards lock down exams to registered accounts and prevent cross-portal access.</p>
            </div>
          </div>
          
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 border-0 bg-white shadow-sm p-4 text-center feature-card">
              <div className="text-success mb-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h6 className="fw-bold mb-2">Session Timers</h6>
              <p className="text-muted small mb-0">Automatic countdown enforces strict durations with automatic submission on timer timeout.</p>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="card h-100 border-0 bg-white shadow-sm p-4 text-center feature-card">
              <div className="text-info mb-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h6 className="fw-bold mb-2">Visual Analytics</h6>
              <p className="text-muted small mb-0">Teachers view class performance distribution and pass rates with interactive SVG analytics.</p>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="card h-100 border-0 bg-white shadow-sm p-4 text-center feature-card">
              <div className="text-warning mb-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h6 className="fw-bold mb-2">Instant Grading</h6>
              <p className="text-muted small mb-0">Multiple choice grading resolves immediately. Teachers review and grade open-ended questions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity / System Statistics */}
      <div className="row g-4 my-5">
        <div className="col-md-4">
          <div className="card stat-card p-4 text-center shadow-sm">
            <h2 className="display-6 fw-bold">3,200+</h2>
            <p className="lead small text-light opacity-75 mb-0">Exams Authored</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card stat-card p-4 text-center shadow-sm">
            <h2 className="display-6 fw-bold">12,500+</h2>
            <p className="lead small text-light opacity-75 mb-0">Submissions Processed</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card stat-card p-4 text-center shadow-sm">
            <h2 className="display-6 fw-bold">100%</h2>
            <p className="lead small text-light opacity-75 mb-0">Evaluation Accuracy</p>
          </div>
        </div>
      </div>

      {/* Accordion FAQ Guidelines Section */}
      <div className="my-5 col-lg-9 mx-auto text-start">
        <h4 className="fw-bold text-dark text-center mb-4">Guidelines & FAQs</h4>
        <div className="accordion shadow-sm rounded-4 overflow-hidden border" id="faqAccordion">
          
          <div className="accordion-item border-0 border-bottom">
            <h2 className="accordion-header" id="headingOne">
              <button className="accordion-button fw-semibold text-dark bg-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                How do students join and submit an exam?
              </button>
            </h2>
            <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
              <div className="accordion-body bg-light text-muted">
                Students must log in, enter their active portal, and input the unique <strong>Exam ID</strong> provided by their teacher. This unlocks the exam interface, starts the countdown timer, and maps completed responses to their student profile.
              </div>
            </div>
          </div>

          <div className="accordion-item border-0 border-bottom">
            <h2 className="accordion-header" id="headingTwo">
              <button className="accordion-button collapsed fw-semibold text-dark bg-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                How does the automated timer functionality work?
              </button>
            </h2>
            <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#faqAccordion">
              <div className="accordion-body bg-light text-muted">
                When a student begins a test, the local system triggers a timer corresponding to the exam's duration. If the duration expires before manual submission, the exam automatically registers the current selections and commits the submission to protect student scores.
              </div>
            </div>
          </div>

          <div className="accordion-item border-0">
            <h2 className="accordion-header" id="headingThree">
              <button className="accordion-button collapsed fw-semibold text-dark bg-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                Can teachers grade open-ended questions?
              </button>
            </h2>
            <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#faqAccordion">
              <div className="accordion-body bg-light text-muted">
                Yes! Multiple-choice options grade automatically, but teachers can navigate to individual submissions to manually award points to open-ended explanations. Once reviewed, the teacher publishes the updated grades.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
