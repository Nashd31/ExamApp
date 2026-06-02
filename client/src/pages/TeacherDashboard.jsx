import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllExams, deleteExam, getExamSubmissions, updateExam } from '../api/examService';
import { useAuth } from '../hooks/useAuth';
import { showSuccess, showError } from '../services/notify';
import { getExamStatus, formatDate } from '../utils/examUtils';
import ExamEditor from '../components/ExamEditor';
import ExamScoresViewer from '../components/ExamScoresViewer';
import GradeSubmissionViewer from '../components/GradeSubmissionViewer';

/**
 * TeacherDashboard Component
 * Provides a comprehensive interface for teachers to manage exams.
 * Capabilities include creating, editing, publishing, deleting exams, and viewing student submissions/scores.
 */
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingScoresExamId, setViewingScoresExamId] = useState(() => location.state?.viewScoresExamId || null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [submissionCounts, setSubmissionCounts] = useState({});

  // Clear navigation state so that refreshing the page does not lock the view on the scores
  useEffect(() => {
    if (location.state?.viewScoresExamId) {
      navigate('/teacher', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Scroll to the top of the main container when switching views (Exams list, editor, scores, grading)
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, [isEditing, viewingScoresExamId, gradingSubmissionId]);

  // Fetches all exams from the server and updates local state.
  const fetchExams = async () => {
    try {
      const data = await getAllExams();
      setExams(data);

      // Fetch submission counts for each exam
      const counts = {};
      for (const exam of data) {
        try {
          const subs = await getExamSubmissions(exam.id);
          counts[exam.id] = subs.length;
        } catch {
          counts[exam.id] = 0;
        }
      }
      setSubmissionCounts(counts);
    } catch (error) {
      showError('Error fetching exams: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // Initial load of all exams when the component mounts
  useEffect(() => {
    const init = async () => {
      await fetchExams();
    };
    init();
  }, []);

  // Prepares an exam for editing by setting local editing state
  const handleEditClick = (exam) => {
    setSelectedExam(exam);
    setIsEditing(true);
  };

  // Prepares editor for creating a new exam
  const handleCreateClick = () => {
    setSelectedExam(null);
    setIsEditing(true);
  };

  const handleTogglePublishGrades = async (exam) => {
    // Validate: exam must be completed and have submissions
    const status = getExamStatus(exam);
    if (status !== 'Done') {
      showError('Grades can only be published once the exam has accomplished.');
      return;
    }
    if (submissionCounts[exam.id] === 0) {
      showError('Cannot publish grades - no student submissions yet.');
      return;
    }

    try {
      setLoading(true);
      const updated = { ...exam, areGradesPublished: !exam.areGradesPublished };
      await updateExam(updated);
      showSuccess(`Grades ${updated.areGradesPublished ? 'published' : 'unpublished'} successfully.`);
      fetchExams();
    } catch (error) {
      showError('Failed to toggle grades publish status: ' + (error.message || error));
      setLoading(false);
    }
  };

  // Prompts for confirmation and deletes the specified exam if confirmed.
  const handleDeleteClick = async (examId) => {
    const confirmed = window.confirm('Are you sure you want to delete this exam?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteExam(examId);
      setExams(exams.filter(exam => exam.id !== examId));
      // Scroll back to the top of the container after deletion
      const container = document.getElementById('main-scroll-container');
      if (container) {
        container.scrollTop = 0;
      }
    } catch (error) {
      showError('Failed to delete exam: ' + (error.message || error));
    }
  };

  const onSaveSuccess = (savedExam, isNew) => {
    if (isNew) {
      setExams((prev) => [...prev, savedExam]);
    } else {
      setExams((prev) => prev.map((e) => (e.id === savedExam.id ? savedExam : e)));
    }
    setIsEditing(false);
    setSelectedExam(null);
  };

  const onCancel = () => {
    setIsEditing(false);
    setSelectedExam(null);
  };

  const totalExams = exams.length;
  const activeExams = exams.filter(e => {
    const s = getExamStatus(e);
    return s === 'Published' || s === 'Scheduled';
  }).length;
  const totalSubmissions = Object.values(submissionCounts).reduce((sum, count) => sum + count, 0);
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'T';

  // Render view: Default main dashboard listing all exams
  return (
    <div className="container mt-2 mb-5 teacher-dashboard-container">
      <style>{`
        .teacher-dashboard-container {
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
            background: linear-gradient(135deg, #0f172a, #022c22) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 20px !important;
            color: #ffffff;
            box-shadow: 0 15px 30px rgba(15, 23, 42, 0.12) !important;
        }

        .welcome-avatar {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981, #059669);
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            text-align: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 25px;
            border: 2.5px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
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
            color: #a7f3d0;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }

        .exam-item-card {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 16px;
            padding: 18px 24px;
            margin-bottom: 12px;
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }
        .exam-item-card:hover {
            transform: translateY(-2px);
            background: #ffffff;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
            border-color: rgba(16, 185, 129, 0.3);
        }

        .status-pill {
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            box-shadow: 0 2px 6px rgba(0,0,0,0.02);
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .status-draft {
            background-color: #f1f5f9;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        .status-scheduled {
            background-color: #fffbeb;
            color: #d97706;
            border: 1px solid #fde68a;
            box-shadow: 0 0 10px rgba(217, 119, 6, 0.08);
        }
        .status-published {
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
            box-shadow: 0 0 10px rgba(5, 150, 105, 0.08);
        }
        .status-done {
            background-color: #eef2ff;
            color: #4f46e5;
            border: 1px solid #c7d2fe;
            box-shadow: 0 0 10px rgba(79, 70, 229, 0.08);
        }

        .btn-action-green {
            background: rgba(16, 185, 129, 0.06);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #059669;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-green:hover:not(:disabled) {
            background: #10b981;
            color: #ffffff;
            border-color: #10b981;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
        }

        .btn-action-amber {
            background: rgba(245, 158, 11, 0.06);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #d97706;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-amber:hover:not(:disabled) {
            background: #f59e0b;
            color: #ffffff;
            border-color: #f59e0b;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(245, 158, 11, 0.15);
        }

        .btn-action-indigo {
            background: rgba(79, 70, 229, 0.06);
            border: 1px solid rgba(79, 70, 229, 0.3);
            color: #4f46e5;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-indigo:hover:not(:disabled) {
            background: #4f46e5;
            color: #ffffff;
            border-color: #4f46e5;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.15);
        }

        .btn-action-blue {
            background: rgba(59, 130, 246, 0.06);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #2563eb;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-blue:hover:not(:disabled) {
            background: #3b82f6;
            color: #ffffff;
            border-color: #3b82f6;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
        }

        .btn-action-rose {
            background: rgba(244, 63, 94, 0.06);
            border: 1px solid rgba(244, 63, 94, 0.3);
            color: #e11d48;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-rose:hover:not(:disabled) {
            background: #f43f5e;
            color: #ffffff;
            border-color: #f43f5e;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(244, 63, 94, 0.15);
        }

        .btn-action-green:disabled,
        .btn-action-amber:disabled,
        .btn-action-indigo:disabled,
        .btn-action-blue:disabled,
        .btn-action-rose:disabled {
            background: rgba(148, 163, 184, 0.05);
            border-color: rgba(148, 163, 184, 0.15);
            color: #94a3b8;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }

        .dashboard-action-btn {
            width: 160px;
            text-align: center;
            justify-content: center;
        }

        .btn-save-exam {
            background: linear-gradient(135deg, #10b981, #059669);
            border: none;
            color: white;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.18);
            transition: all 0.2s ease;
        }
        .btn-save-exam:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
        }
      `}</style>
      
      {/* 1. WELCOME & STATS BANNER */}
      <div className="card welcome-header-card p-4 mb-4 border-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="col-md-7 d-flex align-items-center gap-3 text-start p-3">
            <div className="welcome-avatar">{firstLetter}</div>
            <div>
              <h4 className="mb-1 fw-bold">Welcome back, {user?.name || 'Teacher'}!</h4>
              <p className="mb-0" style={{ color: '#a7f3d0' }}>Teacher Dashboard | Manage exams and grade student submissions</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <div className="d-flex gap-3 justify-content-md-end justify-content-center flex-wrap p-3">
              <div className="stat-box">
                <div className="stat-box-val">{totalExams}</div>
                <div className="stat-box-lbl">Total Exams</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">{activeExams}</div>
                <div className="stat-box-lbl">Active</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-val">{totalSubmissions}</div>
                <div className="stat-box-lbl">Submissions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXAMS MANAGER LIST OR EDITOR OR SCORES VIEWER OR GRADING VIEWER */}
      {gradingSubmissionId ? (
        <GradeSubmissionViewer
          submissionId={gradingSubmissionId}
          onBack={() => setGradingSubmissionId(null)}
        />
      ) : isEditing ? (
        <ExamEditor
          exam={selectedExam}
          exams={exams}
          onSaveSuccess={onSaveSuccess}
          onCancel={onCancel}
        />
      ) : viewingScoresExamId ? (
        <ExamScoresViewer
          examId={viewingScoresExamId}
          onBack={() => setViewingScoresExamId(null)}
          onGrade={(subId) => setGradingSubmissionId(subId)}
        />
      ) : (
        <div className="card portal-glass-card border-0">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Manage Exams</h5>
                <p className="text-muted small mb-0">Create, edit, schedule, or view submissions for all academic tests</p>
              </div>
              <button className="btn btn-save-exam py-2 px-4 rounded-3" onClick={handleCreateClick}>
                + Create New Exam
              </button>
            </div>

            {loading ? (
              <div className="text-center my-5 py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2 small">Loading exams list...</p>
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center my-5 py-4">
                <p className="text-muted mb-3">No exams found. Click "Create New Exam" to get started.</p>
              </div>
            ) : (
              <div className="exams-list-container">
                {exams.map((exam) => {
                  const status = getExamStatus(exam);
                  const subCount = submissionCounts[exam.id] || 0;

                  return (
                    <div key={exam.id} className="exam-item-card">
                      <div className="d-flex row gap-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h6 className="fw-bold mb-0" style={{ color: '#1e293b', fontSize: '15px' }}>
                            {exam.title}
                          </h6>
                          {status === 'Published' && <span className="status-pill status-published">Published</span>}
                          {status === 'Scheduled' && <span className="status-pill status-scheduled">Scheduled</span>}
                          {status === 'Done' && <span className="status-pill status-done">Done</span>}
                          {status === 'Draft' && <span className="status-pill status-draft">Draft</span>}
                        </div>

                        <div className="d-flex align-items-center gap-3 text-secondary flex-wrap mt-1" style={{ fontSize: '12px' }}>
                          <span className="d-flex align-items-center">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                            ID: {exam.id}
                          </span>
                          <span className="d-flex align-items-center">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                            {exam.questions.length} Questions
                          </span>
                          <span className="d-flex align-items-center">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {exam.duration || 60} mins
                          </span>
                          {exam.startDate && (
                            <span className="d-flex align-items-center">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                              Start: {formatDate(exam.startDate)}
                            </span>
                          )}
                          {exam.endDate && (
                            <span className="d-flex align-items-center">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                              End: {formatDate(exam.endDate)}
                            </span>
                          )}
                          <span className="d-flex align-items-center">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                            Submissions: {subCount}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex gap-2 flex-wrap align-items-center justify-content-between">
                        <button
                          className={`btn btn-sm py-1.5 px-3 rounded-3 dashboard-action-btn ${exam.areGradesPublished ? 'btn-action-amber' : 'btn-action-green'}`}
                          onClick={() => handleTogglePublishGrades(exam)}
                          disabled={status !== 'Done' || subCount === 0}
                          title={status !== 'Done' ? 'Grades can only be published once the exam has finished' : subCount === 0 ? 'No student submissions yet' : exam.areGradesPublished ? 'Click to unpublish grades' : 'Click to publish grades'}
                        >
                          {exam.areGradesPublished ? 'Unpublish Grades' : 'Publish Grades'}
                        </button>
                        <button
                          className="btn btn-sm btn-action-indigo py-1.5 px-3 rounded-3 dashboard-action-btn"
                          onClick={() => setViewingScoresExamId(exam.id)}
                        >
                          View Scores
                        </button>
                        <button
                          className="btn btn-sm btn-action-blue py-1.5 px-3 rounded-3 dashboard-action-btn"
                          onClick={() => handleEditClick(exam)}
                          disabled={status === 'Published' || status === 'Done'}
                          title={status === 'Published' || status === 'Done' ? 'Cannot edit published or completed exams' : 'Edit exam'}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-action-rose py-1.5 px-3 rounded-3 dashboard-action-btn"
                          onClick={() => handleDeleteClick(exam.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
