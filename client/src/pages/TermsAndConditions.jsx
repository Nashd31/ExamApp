import { useState } from 'react';

/**
 * Terms and Conditions Page Component.
 * Features a modern layout with a sidebar navigator, academic integrity highlight,
 * and elegant glassmorphic styling matching the application's overall design language.
 */
const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'acceptance', label: '1. Acceptance of Terms', icon: '🤝' },
    { id: 'eligibility', label: '2. Account Registration', icon: '👤' },
    { id: 'integrity', label: '3. Academic Integrity', icon: '🎓' },
    { id: 'timers-grading', label: '4. Timers & Submissions', icon: '⏱️' },
    { id: 'intellectual', label: '5. Intellectual Property', icon: '💡' },
    { id: 'disclaimer', label: '6. Disclaimer of Warranties', icon: '⚠️' },
    { id: 'modifications', label: '7. Term Modifications', icon: '🔄' }
  ];

  const handleScrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="terms-conditions-container container py-4">
      {/* CSS Styles for premium look and feel */}
      <style>{`
        .terms-conditions-container {
          animation: fadeIn 0.8s ease-out;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .terms-header {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
        }
        .terms-sidebar {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          position: sticky;
          top: 90px;
        }
        .terms-content-card {
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
        .terms-warning-box {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(245, 158, 11, 0.05));
          border-left: 4px solid #ef4444;
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
      <div className="terms-header p-5 mb-4 shadow-sm text-center text-md-start">
        <div className="row align-items-center">
          <div className="col-md-8">
            <span className="badge bg-primary px-3 py-2 rounded-pill mb-3 text-uppercase fs-7 fw-semibold tracking-wider">
              Legal Framework
            </span>
            <h1 className="display-5 fw-bold text-dark mb-2">Terms & Conditions</h1>
            <p className="lead text-muted mb-0">
              Rules, regulations, and academic integrity policies governing E-Test System usage.
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
          <div className="terms-sidebar p-3 shadow-sm">
            <h5 className="fw-bold text-dark px-3 mb-3">Terms Sections</h5>
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
          <div className="terms-content-card shadow-sm text-start text-dark">
            
            {/* 1. Acceptance of Terms */}
            <section id="acceptance" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>🤝</span> 1. Acceptance of Terms
              </h3>
              <p>
                By registering for an account, accessing the <strong>Student Portal</strong>, or launching the <strong>Teacher Dashboard</strong> on the <strong>E-Test System</strong>, you agree to be bound by these Terms and Conditions.
              </p>
              <p>
                If you do not agree to all of these terms, you are prohibited from using this web application. These terms constitute a legally binding agreement between you and the institution hosting this portal.
              </p>
            </section>

            {/* 2. Account Registration & Conduct */}
            <section id="eligibility" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>👤</span> 2. Account Registration & Conduct
              </h3>
              <p>
                To utilize the examination system, users must create a credentials profile:
              </p>
              <div className="bullet-point"><strong>Registration Info:</strong> You must supply accurate, complete registration details. Providing mock identity names or impersonating other institutional students is prohibited.</div>
              <div className="bullet-point"><strong>Credential Security:</strong> You are responsible for keeping your password secure. Do not share login sessions with peers. You are fully accountable for all activities originating from your account.</div>
              <div className="bullet-point"><strong>Role Segregation:</strong> Access rights are governed strictly. Students are forbidden from using unauthorized API keys or routes to access teacher grading dashboards.</div>
            </section>

            {/* 3. Academic Integrity */}
            <section id="integrity" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>🎓</span> 3. Academic Integrity
              </h3>
              <div className="terms-warning-box">
                <h6 className="fw-bold text-danger d-flex align-items-center gap-2">
                  <span>⚠️</span> Academic Honesty Agreement
                </h6>
                <p className="small mb-0">
                  By starting an exam on this platform, you certify that all answers submitted are your own work, completed without unauthorized materials, external internet lookups, or third-party assistance.
                </p>
              </div>
              <p>
                To protect assessment validity, the following activities are strictly prohibited:
              </p>
              <div className="bullet-point">Cheating or sharing exam answers during or after exam sessions.</div>
              <div className="bullet-point">Using external tabs, browser devtools, or extensions to intercept exam answer payloads or view key sheets.</div>
              <div className="bullet-point">Modifying API requests or submission forms to insert incorrect time durations or modify grades.</div>
              <div className="bullet-point">Attempting to access, edit, or delete exams created by teachers.</div>
              <p className="mt-3 text-muted small">
                Violations will be reported directly to the Academic Discipline Committee and may result in immediate suspension, exam disqualification (score of 0), or termination of your profile.
              </p>
            </section>

            {/* 4. Timers & Submissions */}
            <section id="timers-grading" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>⏱️</span> 4. Timers & Submissions
              </h3>
              <p>
                The E-Test System uses specific technical rules for exam submissions:
              </p>
              <div className="bullet-point"><strong>Strict Countdown:</strong> Exams are timed. The active timer begins counting down the moment the student joins the exam page.</div>
              <div className="bullet-point"><strong>Automatic Submissions:</strong> If the timer expires before a student manually clicks the submit button, the portal automatically commits all current selections. This is designed to protect your grade and prevent data loss.</div>
              <div className="bullet-point"><strong>Submission Validity:</strong> Submissions are final. Once committed, a student cannot modify or retract their answers.</div>
              <div className="bullet-point"><strong>Grading Transparency:</strong> Multiple-choice questions are auto-graded. Open-ended answers are pending until reviewed by the teacher. Final grades are published only after manual grading is complete.</div>
            </section>

            {/* 5. Intellectual Property */}
            <section id="intellectual" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>💡</span> 5. Intellectual Property
              </h3>
              <p>
                The materials published on this application are protected:
              </p>
              <div className="bullet-point"><strong>Exam Contents:</strong> All exam questions, templates, texts, and diagrams are the intellectual property of the authoring teachers and their institution. Students may not screenshot, save, or distribute exam content.</div>
              <div className="bullet-point"><strong>System Assets:</strong> The application interface, logos, graphics, styles, and software logic are the property of the E-Test System developers.</div>
            </section>

            {/* 6. Disclaimer of Warranties */}
            <section id="disclaimer" className="mb-5">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>⚠️</span> 6. Disclaimer of Warranties
              </h3>
              <p>
                The E-Test System is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis. While we strive to ensure 100% platform uptime, we do not warrant that:
              </p>
              <div className="bullet-point">The services will be uninterrupted or error-free.</div>
              <div className="bullet-point">Data submissions will never experience network delays or packet losses.</div>
              <div className="bullet-point">Students will not experience local power or network outages during exam windows.</div>
              <p className="mt-3">
                Students are strongly advised to take exams on a stable internet connection and submit their work before the final minutes of the session countdown.
              </p>
            </section>

            {/* 7. Modifications */}
            <section id="modifications">
              <h3 className="section-header d-flex align-items-center gap-2">
                <span>🔄</span> 7. Term Modifications
              </h3>
              <p>
                We reserve the right to revise these Terms and Conditions at any time. Updates will be indicated by the "Last Updated" date at the top of this page.
              </p>
              <p>
                Your continued use of the E-Test System after terms updates constitute your acceptance of the revised Terms and Conditions.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
