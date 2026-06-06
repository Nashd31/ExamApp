import { useState } from 'react';

/**
 * Privacy Policy Page Component.
 * Features a modern layout with a sidebar navigator, search functionality,
 * and elegant glassmorphic styling matching the application's overall design language.
 */
const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    { id: 'intro', label: '1. Introduction', icon: 'ℹ️' },
    { id: 'data-collected', label: '2. Information We Collect', icon: '📝' },
    { id: 'data-usage', label: '3. How We Use Data', icon: '⚙️' },
    { id: 'data-security', label: '4. Security & Storage', icon: '🔒' },
    { id: 'data-sharing', label: '5. Sharing & Permissions', icon: '🤝' },
    { id: 'cookies', label: '6. Cookies & Sessions', icon: '🍪' },
    { id: 'contact', label: '7. Contact Us', icon: '✉️' }
  ];

  const handleScrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="privacy-policy-container container py-4">
      {/* CSS Styles for premium look and feel */}
      <style>{`
        .privacy-policy-container {
          animation: fadeIn 0.8s ease-out;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .policy-header {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
        }
        .policy-sidebar {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          position: sticky;
          top: 90px;
        }
        .policy-content-card {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          padding: 2.5rem;
        }
        .nav-item-btn {
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nav-item-btn:hover {
          background: rgba(91, 124, 250, 0.08);
          color: #5b7cfa;
        }
        .nav-item-btn.active {
          background: #5b7cfa;
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(91, 124, 250, 0.2);
        }
        .section-header {
          color: #1e3a5f;
          font-weight: 700;
          border-bottom: 2px solid rgba(91, 124, 250, 0.15);
          padding-bottom: 8px;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .policy-highlight-box {
          background: linear-gradient(135deg, rgba(91, 124, 250, 0.05), rgba(6, 182, 212, 0.05));
          border-left: 4px solid #5b7cfa;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .bullet-point {
          position: relative;
          padding-left: 24px;
          margin-bottom: 8px;
        }
        .bullet-point::before {
          content: "•";
          color: #5b7cfa;
          font-weight: bold;
          font-size: 18px;
          position: absolute;
          left: 8px;
          top: -2px;
        }
      `}</style>

      {/* Header Banner */}
      <div className="policy-header p-5 mb-4 shadow-sm text-center text-md-start">
        <div className="row align-items-center">
          <div className="col-md-8">
            <span className="badge bg-primary px-3 py-2 rounded-pill mb-3 text-uppercase fs-7 fw-semibold tracking-wider">
              Legal Information
            </span>
            <h1 className="display-5 fw-bold text-dark mb-2">Privacy Policy</h1>
            <p className="lead text-muted mb-0">
              How the E-Test System collects, uses, and safeguards student and teacher data.
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-4 mt-md-0">
            <div className="d-inline-block text-start p-3 bg-white bg-opacity-70 rounded-3 border">
              <div className="small text-muted">Last Updated</div>
              <div className="fw-bold text-dark">June 6, 2026</div>
              <div className="small text-muted">Version 1.0</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Navigation Sidebar */}
        <div className="col-lg-4 d-none d-lg-block">
          <div className="policy-sidebar p-3 shadow-sm">
            <h5 className="fw-bold text-dark px-3 mb-3">Policy Sections</h5>
            <div className="d-flex flex-column gap-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleScrollToSection(sec.id)}
                  className={`nav-item-btn ${activeSection === sec.id ? 'active' : ''}`}
                >
                  <span>{sec.icon}</span>
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="col-lg-8">
          <div className="policy-content-card shadow-sm text-start text-dark">
            
            {/* 1. Introduction */}
            <section id="intro" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>ℹ️</span> 1. Introduction
              </h3>
              <p>
                Welcome to the <strong>E-Test System</strong>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy governs our data handling practices for users accessing both the <strong>Student Portal</strong> and the <strong>Teacher Dashboard</strong>.
              </p>
              <div className="policy-highlight-box">
                <strong>Our Privacy Promise:</strong> We do not sell, trade, or distribute your personal profile details or exam submissions to third-party advertisers. All data stored within our system is used strictly to authorize your account, facilitate exams, and present academic evaluations.
              </div>
              <p>
                By creating an account, registering for exams, or authoring assessment questionnaires, you consent to the collection and processing of your details as outlined in this policy.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section id="data-collected" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>📝</span> 2. Information We Collect
              </h3>
              <p>
                To provide a functional and reliable digital assessment experience, the system records specific data based on your user role:
              </p>
              
              <h5 className="fw-bold text-secondary mt-3">A. Account Information</h5>
              <div className="bullet-point"><strong>Authentication Credentials:</strong> Names, email addresses, and encrypted password hashes.</div>
              <div className="bullet-point"><strong>User Role:</strong> Defined as either "Teacher" or "Student" to restrict page access and route actions.</div>
              <div className="bullet-point"><strong>Profile Preferences:</strong> Avatar styles, display preferences, and custom avatar initials.</div>

              <h5 className="fw-bold text-secondary mt-3">B. Teacher Data</h5>
              <div className="bullet-point"><strong>Exam Design details:</strong> Questions, answer options, correct answer keys, and point allocations.</div>
              <div className="bullet-point"><strong>Exam Configurations:</strong> Timers, scheduling parameters, accessibility gates, and custom descriptions.</div>

              <h5 className="fw-bold text-secondary mt-3">C. Student & Performance Data</h5>
              <div className="bullet-point"><strong>Exam Submissions:</strong> Chosen multiple-choice selections, typed open-ended text answers, and total submission times.</div>
              <div className="bullet-point"><strong>Activity Indicators:</strong> Marks of exam starts, durations, completed answers, and automatic submission logs triggered by exam timeouts.</div>
              <div className="bullet-point"><strong>Grading Scores:</strong> Automated scores for multiple-choice sections and manual teacher-awarded scores for open-ended questions.</div>
            </section>

            {/* 3. How We Use Data */}
            <section id="data-usage" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>⚙️</span> 3. How We Use Data
              </h3>
              <p>
                The E-Test System uses your information to execute its core operations:
              </p>
              <div className="bullet-point"><strong>Identity Verification:</strong> Enforcing role-based page guards so students cannot enter the Teacher Dashboard or edit exam templates.</div>
              <div className="bullet-point"><strong>Assessment Execution:</strong> Rendering questions, tracking active timers, and registering submissions.</div>
              <div className="bullet-point"><strong>Automated Evaluations:</strong> Comparing student choices against teacher-provided answer keys to instantly calculate multiple-choice scores.</div>
              <div className="bullet-point"><strong>Academic Analytics:</strong> Building visual charts (such as class performance distributions and pass/fail statistics) for teachers to review overall class performance.</div>
              <div className="bullet-point"><strong>Manual Grading:</strong> Displaying student text submissions to teachers so they can manually review, grade, and publish updated scores.</div>
            </section>

            {/* 4. Security & Storage */}
            <section id="data-security" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>🔒</span> 4. Security & Storage
              </h3>
              <p>
                We prioritize protecting your data using robust technical safeguards:
              </p>
              <div className="bullet-point"><strong>Cryptographic Security:</strong> Passwords are encrypted before storage in our database, preventing raw access.</div>
              <div className="bullet-point"><strong>Session Access Controls:</strong> We verify JSON Web Tokens (JWT) or secure session parameters on each request to prevent unauthorized database commands.</div>
              <div className="bullet-point"><strong>Secure Environment:</strong> Project database calls use prepared configurations and environment parameters to block access vulnerability.</div>
              <p className="mt-3">
                Please note that no digital storage or internet communication is 100% secure. Although we use industry-standard measures, we cannot guarantee absolute data security.
              </p>
            </section>

            {/* 5. Sharing & Permissions */}
            <section id="data-sharing" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>🤝</span> 5. Sharing & Permissions
              </h3>
              <p>
                Data transparency is a priority. Here is how your data is distributed:
              </p>
              <div className="bullet-point"><strong>With Teachers:</strong> Student names, submission records, times, and answers are fully visible to the respective exam creator (teacher) for evaluation and grade reporting.</div>
              <div className="bullet-point"><strong>With Students:</strong> Students can view their own scores, grades, and teacher reviews. Students cannot access other students' individual exam logs.</div>
              <div className="bullet-point"><strong>No Third-Party Disclosures:</strong> We do not disclose student records or exam content to marketing companies or external advertisers.</div>
            </section>

            {/* 6. Cookies & Sessions */}
            <section id="cookies" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>🍪</span> 6. Cookies & Sessions
              </h3>
              <p>
                We use cookies and browser local storage to improve application usability:
              </p>
              <div className="bullet-point"><strong>Authentication Tokens:</strong> Storing active login sessions so you do not have to re-enter passwords when switching pages.</div>
              <div className="bullet-point"><strong>Layout Preferences:</strong> Recalling theme modes, sidebar states, or visual configs.</div>
              <p className="mt-3">
                You can configure your browser to reject cookies or clear local storage, but doing so will require you to log back in and may affect some portal operations.
              </p>
            </section>

            {/* 7. Contact Us */}
            <section id="contact">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>✉️</span> 7. Contact Us
              </h3>
              <p>
                If you have questions, comments, or data deletion requests regarding this Privacy Policy, please contact the E-Test System Administration team:
              </p>
              <div className="bg-light p-3 rounded-3 border">
                <div className="fw-semibold text-dark">E-Test Administration Team</div>
                <div className="text-muted small">Department of Computer Science & Web Engineering</div>
                <div className="text-primary small">support@etest-system.edu</div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
