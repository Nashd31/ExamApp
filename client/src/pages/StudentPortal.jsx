import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExamById, getStudentSubmissions } from '../api/examService';
import { useAuth } from '../hooks/useAuth';
import { showError } from '../services/notify';
import { getExamStatus, formatDate } from '../utils/examUtils';
import ReviewExamViewer from '../components/ReviewExamViewer';

/**
 * Renders the Student Portal dashboard.
 * Allows students to search for an exam by ID to take it,
 * and displays a history of their past exam submissions with summary stats.
 */
const StudentPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [examId, setExamId] = useState('');
  const [exam, setExam] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pastExams, setPastExams] = useState([]);
  const [loadingPast, setLoadingPast] = useState(true);
  const [reviewingExamId, setReviewingExamId] = useState(null);

  // Scroll to the top of the main container when switching between portal list and review sheet
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, [reviewingExamId]);

  /**
   * Fetches the details of an exam based on the provided exam ID.
   * Validates if the exam exists and is currently published.
   * Updates component state with the exam details or an error message.
   */
  const handleFetchExam = async () => {
    if (!examId) return;
    setLoading(true);
    setError('');
    setExam(null);
    try {
      const data = await getExamById(examId);
      const status = getExamStatus(data);
      if (status === 'Scheduled') {
        const message = 'This exam is not available yet.';
        setError(message);
      } else if (status === 'Published') {
        setExam(data);
      } else {
        const message = 'This exam is not available.';
        setError(message);
      }
    } catch (err) {
      const message = err?.message || 'Unable to find exam.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Loads the current student's past exam submissions on component mount.
  useEffect(() => {
    const loadPast = async () => {
      if (!user?.name) {
        setLoadingPast(false);
        return;
      }
      setLoadingPast(true);
      try {
        const data = await getStudentSubmissions(user.name);
        setPastExams(data || []);
      } catch (err) {
        showError(err?.message || 'Failed to load past exams');
      } finally {
        setLoadingPast(false);
      }
    };
    loadPast();
  }, [user]);

  // Calculations for stats boxes
  const totalTaken = pastExams.length;
  const passedExams = pastExams.filter(p => p.areGradesPublished !== false && p.score >= p.passGrade).length;
  const pendingExams = pastExams.filter(p => p.areGradesPublished === false).length;
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className="container mt-2 mb-5 student-portal-container">
      <style>{`
        .student-portal-container {
            animation: fadeInPortal 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes fadeInPortal {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .portal-glass-card {
            background: rgba(255, 255, 255, 0.6) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.45) !important;
            border-radius: 20px !important;
            box-shadow: 0 15px 35px rgba(30, 41, 59, 0.04) !important;
            transition: all 0.3s ease;
        }

        .welcome-header-card {
            background: linear-gradient(135deg, #1e293b, #0f172a) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 20px !important;
            color: #ffffff;
            box-shadow: 0 15px 30px rgba(15, 23, 42, 0.12) !important;
        }

        .welcome-avatar {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            text-align: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 25px;
            border: 2.5px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 16px rgba(79, 70, 229, 0.2);
            flex-shrink: 0;
        }

        .stat-box {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 8px 16px;
            text-align: center;
            flex: 0 0 auto;
            min-width: 120px;
        }
        .stat-box-val {
            font-size: 19px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.2;
        }
        .stat-box-lbl {
            font-size: 10px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }

        /* Exam Search custom styles */
        .search-icon-wrapper {
            position: relative;
            flex-grow: 1;
        }
        .search-icon-wrapper svg {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
        }
        .search-icon-wrapper .form-control {
            padding-left: 42px;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .search-icon-wrapper .form-control:focus {
            border-color: #4f46e5;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }

        .btn-search {
            height: 44px;
            padding: 0 22px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            background: linear-gradient(135deg, #4f46e5, #3b82f6);
            border: none;
            color: white;
            transition: all 0.3s ease;
        }
        .btn-search:hover {
            transform: translateY(-1px);
            box-shadow: 0 5px 12px rgba(79, 70, 229, 0.2);
        }

        .found-exam-box {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(99, 102, 241, 0.15);
            border-radius: 14px;
            padding: 16px 20px;
            box-shadow: 0 8px 24px rgba(30, 41, 59, 0.03);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            animation: slideDown 0.4s ease-out;
        }
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .btn-start-exam {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none;
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            border-radius: 9px;
            padding: 8px 18px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .btn-start-exam:hover {
            transform: translateY(-1px);
            box-shadow: 0 5px 12px rgba(245, 158, 11, 0.2);
        }

        /* Modern Data Table */
        .modern-student-table {
            margin-bottom: 0;
        }
        .modern-student-table th {
            font-weight: 700;
            font-size: 15px;
            color: #21477dff;
            background: rgba(185, 220, 255, 0.6) !important;
            padding: 12px 18px;
            border-bottom: 1.5px solid #cbd5e1;
        }
        .modern-student-table td {
            padding: 12px 18px;
            font-size: 14px;
            color: #334155;
            border-bottom: 1px solid #e2e8f0;
        }
        .modern-student-table tr {
            transition: all 0.2s ease;
        }
        .modern-student-table tr:hover {
            background-color: rgba(79, 70, 229, 0.02) !important;
        }

        /* Badge Pill elements */
        .badge-pill-custom {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-weight: 600;
            font-size: 12px;
            padding: 3px 10px;
            border-radius: 12px;
        }
        .badge-pill-custom.passed {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }
        .badge-pill-custom.failed {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }
        .badge-pill-custom.pending {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
        }

        .btn-review-outline {
            border: 1px solid rgba(79, 70, 229, 0.3) !important;
            background: rgba(79, 70, 229, 0.05) !important;
            color: #4f46e5 !important;
            font-size: 13px;
            font-weight: 600;
            padding: 4px 10px !important;
            border-radius: 7.5px;
            transition: all 0.2s ease;
        }
        .btn-review-outline:hover {
            background: #4f46e5 !important;
            color: #ffffff !important;
            border-color: #4f46e5 !important;
            box-shadow: 0 3px 8px rgba(79, 70, 229, 0.15);
        }

        .alert-modern-error {
            background: rgba(244, 63, 94, 0.07);
            border: 1px solid rgba(244, 63, 94, 0.15);
            color: #e11d48;
            border-radius: 12px;
            padding: 10px 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideDown 0.4s ease-out;
        }
      `}</style>

      {/* 1. Welcome & Stats Header Card */}
      <div className="card welcome-header-card p-4 mb-4 border-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="col-md-7 d-flex align-items-center gap-3 text-start p-3">
            <div className="welcome-avatar">{firstLetter}</div>
            <div>
              <h2 className="fw-bold mb-1">Welcome Back, {user?.name || 'Student'}!</h2>
              <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Student Portal | Ready to take your scheduled tests</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <div className="d-flex gap-3 justify-content-md-end justify-content-center flex-wrap p-3">
              <div className="stat-box">
                <div className="stat-box-val">{totalTaken}</div>
                <div className="stat-box-lbl">Taken</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">{passedExams}</div>
                <div className="stat-box-lbl">Passed</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">{pendingExams}</div>
                <div className="stat-box-lbl">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search Exam ID Card & Submission Logs Card OR Review Exam Viewer */}
      {reviewingExamId ? (
        <ReviewExamViewer
          examId={reviewingExamId}
          studentName={user?.name}
          onBack={() => setReviewingExamId(null)}
        />
      ) : (
        <>
          {/* 2. Search Exam ID Card */}
          <div className="card portal-glass-card px-4 py-4 mb-4">
            <div className="card-body p-2 text-start">
              <h5 className="fw-bold text-dark mb-1">Take an Exam</h5>
              <p className="text-muted mb-4 small">Enter the Examination ID provided by your supervisor to load and start your test.</p>
              
              <form className="d-flex gap-2 mb-3 w-100 flex-sm-row flex-column" onSubmit={(e) => { e.preventDefault(); handleFetchExam(); }}>
                <div className="search-icon-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. EXAM_12345"
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                  />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <button
                  className="btn btn-search flex-shrink-0"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Searching...
                    </>
                  ) : 'Search Exam'}
                </button>
              </form>

              {error && (
                <div className="alert-modern-error my-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted small">Locating exam details...</p>
                </div>
              ) : (
                exam && (
                  <div className="found-exam-box mt-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="welcome-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </div>
                      <div className="text-start">
                        <h6 className="fw-bold mb-0 text-dark">{exam.title}</h6>
                        <span className="text-muted small">{exam.questions.length} questions available</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-start-exam"
                      onClick={() => navigate(`/take-exam/${exam.id}`)}
                    >
                      <span>Begin Now</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 3. Past Exams Log Card */}
          <div className="card portal-glass-card px-4 py-4 mb-4">
            <div className="card-body p-2 text-start">
              <h5 className="fw-bold text-dark mb-4">My Submission Logs</h5>
              {loadingPast ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted small">Loading past exams...</p>
                </div>
              ) : pastExams.length === 0 ? (
                <div className="text-center py-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="mb-2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="13" x2="15" y2="13"></line>
                    <line x1="9" y1="17" x2="13" y2="17"></line>
                  </svg>
                  <p className="text-muted small mb-0">No past exam submissions found.</p>
                </div>
              ) : (
                <div className="table-responsive rounded-4">
                  <table className="table table-hover align-middle modern-student-table text-start">
                    <thead>
                      <tr>
                        <th>Exam</th>
                        <th>Submission Date</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastExams.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-semibold text-dark">{p.title}</td>
                          <td className="text-muted">{formatDate(p.submittedAt)}</td>
                          <td>
                            {p.areGradesPublished === false ? (
                              <span className="text-warning small fw-semibold">Pending Review</span>
                            ) : (
                              <span className="fw-bold text-dark">{p.score}%</span>
                            )}
                          </td>
                          <td>
                            {p.areGradesPublished === false ? (
                              <span className="badge-pill-custom pending">
                                <span className="spinner-grow spinner-grow-sm me-1" style={{ width: '8px', height: '8px' }} role="status"></span>
                                Pending
                              </span>
                            ) : p.score >= p.passGrade ? (
                              <span className="badge-pill-custom passed">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Passed
                              </span>
                            ) : (
                              <span className="badge-pill-custom failed">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Failed
                              </span>
                            )}
                          </td>
                          <td>
                            {p.areGradesPublished !== false ? (
                              <button
                                className="btn btn-review-outline"
                                onClick={() => setReviewingExamId(p.examId)}
                              >
                                Review
                              </button>
                            ) : (
                              <span className="text-muted small italic">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentPortal;
