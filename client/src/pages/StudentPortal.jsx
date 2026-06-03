import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExamById, getStudentSubmissions, getAllExams, getStudentEnrolledCourses, unenrollStudentFromCourse } from '../api/examService';
import { useAuth } from '../hooks/useAuth';
import { showSuccess } from '../services/notify';
import { useDialog } from '../hooks/useDialog';
import { getExamStatus, formatDate } from '../utils/examUtils';
import ReviewExamViewer from '../components/ReviewExamViewer';

/**
 * Renders the Student Portal dashboard.
 * Allows students to search for an exam by ID to take it,
 * and displays a history of their past exam submissions organized by enrolled courses.
 */
const StudentPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showConfirm } = useDialog();
  
  // Existing states
  const [examId, setExamId] = useState('');
  const [exam, setExam] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pastExams, setPastExams] = useState([]);
  const [loadingPast, setLoadingPast] = useState(() => !!user?.id);
  const [reviewingExamId, setReviewingExamId] = useState(null);

  // Course states
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [isSearchingExam, setIsSearchingExam] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Scroll to the top of the main container when switching between portal views
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, [reviewingExamId, selectedCourseId, isSearchingExam]);

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

  const loadPortalData = async (initialLoad = false) => {
    if (!user?.id) {
      setLoadingPast(false);
      return;
    }
    setLoadingPast(true);
    setError('');
    try {
      const [submissionsData, coursesData, examsData] = await Promise.all([
        getStudentSubmissions(user.name),
        getStudentEnrolledCourses(user.id),
        getAllExams()
      ]);
      setPastExams(submissionsData || []);
      setEnrolledCourses(coursesData || []);
      setAllExams(examsData || []);
      
      if (initialLoad) {
        setSelectedCourseId(prev => {
          if (!prev && coursesData && coursesData.length > 0) {
            return coursesData[0].id;
          }
          return prev;
        });
      }
    } catch (err) {
      setError(err?.message || 'Failed to load portal data');
    } finally {
      setLoadingPast(false);
    }
  };

  // Loads the portal data (enrolled courses, exams, past submissions) on component mount.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const fetchInitialData = async () => {
      try {
        const [submissionsData, coursesData, examsData] = await Promise.all([
          getStudentSubmissions(user.name),
          getStudentEnrolledCourses(user.id),
          getAllExams()
        ]);
        if (active) {
          setPastExams(submissionsData || []);
          setEnrolledCourses(coursesData || []);
          setAllExams(examsData || []);
          setSelectedCourseId(prev => {
            if (!prev && coursesData && coursesData.length > 0) {
              return coursesData[0].id;
            }
            return prev;
          });
        }
      } catch (err) {
        if (active) {
          setError(err?.message || 'Failed to load portal data');
        }
      } finally {
        if (active) {
          setLoadingPast(false);
        }
      }
    };
    fetchInitialData();
    return () => { active = false; };
  }, [user?.id, user?.name]);



  // Handles leaving/unenrolling from a course
  const handleLeaveCourse = async (courseId, courseName) => {
    setError('');
    const confirmed = await showConfirm(
      `Leave "${courseName}"?`,
      'You will lose access to its submissions.'
    );
    if (!confirmed) return;

    try {
      setLoadingPast(true);
      await unenrollStudentFromCourse(user.id, courseId);
      showSuccess(`Successfully left course "${courseName}"`);
      
      setEnrolledCourses(prev => {
        const nextCourses = prev.filter(c => c.id !== courseId);
        if (nextCourses.length > 0) {
          setSelectedCourseId(nextCourses[0].id);
        } else {
          setSelectedCourseId(null);
        }
        return nextCourses;
      });
      
      await loadPortalData(false);
    } catch (err) {
      setError(err?.message || 'Failed to leave course');
    } finally {
      setLoadingPast(false);
    }
  };

  // Calculations for stats boxes
  const totalTaken = pastExams.length;
  const passedExams = pastExams.filter(p => p.areGradesPublished !== false && p.score >= p.passGrade).length;
  const pendingExams = pastExams.filter(p => p.areGradesPublished === false).length;
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  const filteredCourses = enrolledCourses.filter(c =>
    c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(courseSearchQuery.toLowerCase())
  );

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

        .course-sidebar {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.45);
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 15px 35px rgba(30, 41, 59, 0.04);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .sidebar-course-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
        }
        .sidebar-search-wrapper {
            position: relative;
            width: 100%;
            margin-bottom: 8px;
        }
        .sidebar-search-wrapper svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
        }
        .sidebar-search-input {
            padding-left: 36px;
            padding-right: 12px;
            height: 38px;
            border-radius: 10px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            background: rgba(255, 255, 255, 0.5);
            font-size: 13.5px;
            width: 100%;
            transition: all 0.25s ease;
        }
        .sidebar-search-input:focus {
            border-color: #4f46e5;
            background: #ffffff;
            outline: none;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
        .sidebar-course-item {
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
            border: 1px solid transparent;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
        }
        .sidebar-course-item:hover {
            background: rgba(255, 255, 255, 0.85);
            transform: translateY(-1px);
            border-color: rgba(79, 70, 229, 0.2);
        }
        .sidebar-course-item.active {
            background: linear-gradient(135deg, #4f46e5, #3b82f6);
            color: #ffffff !important;
            border-color: #3b82f6;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        .sidebar-course-item.active .course-title {
            color: #ffffff !important;
        }
        .sidebar-course-item.active .course-code {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }
        .course-title {
            font-weight: 700;
            font-size: 14.5px;
            color: #1e293b;
            margin-bottom: 4px;
            line-height: 1.3;
        }
        .course-code {
            font-size: 11px;
            font-weight: 700;
            padding: 2.5px 8px;
            border-radius: 20px;
            background: #f1f5f9;
            color: #64748b;
            border: 1px solid #e2e8f0;
            text-transform: uppercase;
        }
        .sidebar-add-course-btn {
            background: rgba(79, 70, 229, 0.05);
            border: 1px dashed rgba(79, 70, 229, 0.3);
            color: #4f46e5;
            font-weight: 600;
            font-size: 13px;
            border-radius: 10px;
            padding: 8px 14px;
            width: 100%;
            transition: all 0.2s ease;
            border-style: dashed;
        }
        .sidebar-add-course-btn:hover {
            background: rgba(79, 70, 229, 0.12);
            border-color: #4f46e5;
            border-style: solid;
        }
        .sidebar-add-exam-btn {
            background: linear-gradient(135deg, #4f46e5, #3b82f6);
            color: #ffffff;
            font-weight: 600;
            font-size: 13.5px;
            border: none;
            border-radius: 12px;
            padding: 10px 16px;
            width: 100%;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
        }
        .sidebar-add-exam-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.22);
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
            color: white;
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

      {/* 2. Main Portal Area */}
      {/* 2. Side-by-Side Sidebar and Content Area */}
      <div className="row g-4">
        {/* Left Side: Course Sidebar */}
        <div className="col-lg-3 col-md-4">
          <div className="course-sidebar text-start">
            <h5 className="fw-bold mb-2 text-dark">My Courses</h5>
            
            {/* Action Buttons at the Top */}
            <div className="d-flex flex-column gap-2">
              <button 
                className="sidebar-add-exam-btn"
                onClick={() => {
                  setIsSearchingExam(true);
                  setSelectedCourseId(null);
                  setReviewingExamId(null);
                  setError('');
                }}
              >
                Take Exam by ID
              </button>
            </div>

            <hr className="m-0" />

            {enrolledCourses.length > 0 && (
              <div className="sidebar-search-wrapper">
                <input
                  type="text"
                  className="sidebar-search-input"
                  placeholder="Filter courses..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            )}

            {enrolledCourses.length === 0 ? (
              <div className="text-muted small my-auto">No courses enrolled.</div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-muted small my-3">No matching courses.</div>
            ) : (
              <ul className="sidebar-course-list">
                {filteredCourses.map(c => (
                  <li 
                    key={c.id} 
                    className={`sidebar-course-item ${selectedCourseId === c.id && !isSearchingExam && !reviewingExamId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setIsSearchingExam(false);
                      setReviewingExamId(null);
                      setError('');
                    }}
                  >
                    <span className="course-title">{c.name}</span>
                    <span className="course-code">{c.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Side: Main Content Panel */}
        <div className="col-lg-9 col-md-8">
          {reviewingExamId ? (
            <ReviewExamViewer
              examId={reviewingExamId}
              studentName={user?.name}
              onBack={() => setReviewingExamId(null)}
            />
          ) : isSearchingExam ? (
            // Take Exam by ID Card
            <div className="card portal-glass-card border-0 p-4 p-md-5 text-start">
              <h5 className="fw-bold text-dark mb-1">Direct Exam Search</h5>
              <p className="text-muted small mb-4">Or search for a specific test directly by entering its unique Exam ID.</p>
              
              <form className="d-flex flex-column gap-3" onSubmit={(e) => { e.preventDefault(); handleFetchExam(); }}>
                <div className="search-icon-wrapper w-100">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 1, 2, 3"
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    style={{ height: '44px' }}
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-search py-2 px-4 btn-sm"
                    type="submit"
                    disabled={loading}
                    style={{ height: '42px', color: 'white'}}
                  >
                    {loading ? 'Searching...' : 'Search Exam'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary py-2 px-4 rounded-3 btn-sm"
                    onClick={() => {
                      setIsSearchingExam(false);
                      setError('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {error && (
                <div className="alert-modern-error my-3">
                  <div className="d-flex align-items-center gap-2 flex-grow-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{error}</span>
                  </div>
                  <button type="button" className="btn-close ms-auto" style={{ fontSize: '10px' }} onClick={() => setError('')} aria-label="Close"></button>
                </div>
              )}

              {exam && (
                <div className="found-exam-box mt-3 text-start">
                  <div className="d-flex align-items-center gap-3">
                    <div className="welcome-avatar" style={{ width: '36px', height: '36px', fontSize: '15px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      📝
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '13.5px' }}>{exam.title}</h6>
                      <span className="text-muted small" style={{ fontSize: '11px' }}>{exam.questions.length} questions</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-start-exam btn-sm py-1.5 px-3 flex-shrink-0"
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        'Ready to start?',
                        `You are about to begin the exam "${exam.title}". The timer will start immediately.`,
                        'greenConfirm'
                      );
                      if (confirmed) {
                        navigate(`/take-exam/${exam.id}`);
                      }
                    }}
                  >
                    Begin Now 
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Selected Course Drill-Down or Default view
            (() => {
              const course = enrolledCourses.find(c => c.id === selectedCourseId);
              if (!course) {
                return (
                  <div className="card portal-glass-card border-0 p-5 text-center">
                    <h5 className="fw-bold mb-2 text-dark">No Course Selected</h5>
                    <p className="text-muted small mb-0">Select an enrolled course from the sidebar, or click "Take Exam by ID" to start a new exam.</p>
                  </div>
                );
              }

              // Filter exams belonging to this course
              const courseExams = allExams.filter(e => e.courseId === selectedCourseId);
              const courseSubmissions = pastExams.filter(p => courseExams.some(e => e.id === p.examId));

              return (
                <div className="card portal-glass-card border-0 p-4 p-md-5 text-start">
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 pb-3 border-bottom text-start">
                    <div>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-bold mb-2" style={{ fontSize: '11px' }}>
                        {course.code}
                      </span>
                      <h3 className="fw-bold mb-1 text-dark">{course.name}</h3>
                      <p className="text-muted small mb-0">Review your graded assessments and exam submissions for this course</p>
                    </div>
                    <div>
                      <button
                        className="btn btn-outline-danger py-1.5 px-3 rounded-3 fw-semibold btn-sm d-flex align-items-center gap-1.5"
                        onClick={() => handleLeaveCourse(course.id, course.name)}
                        style={{ borderStyle: 'solid', fontSize: '12px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Leave Course
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="alert-modern-error mb-4">
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{error}</span>
                      </div>
                      <button type="button" className="btn-close ms-auto" style={{ fontSize: '10px' }} onClick={() => setError('')} aria-label="Close"></button>
                    </div>
                  )}

                  {/* Course Submissions Section */}
                  <div>
                    <h5 className="fw-bold mb-3 text-dark">My Course Submissions</h5>
                    {loadingPast ? (
                      <div className="text-center my-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : courseSubmissions.length === 0 ? (
                      <div className="p-4 bg-light rounded-4 text-center border">
                        <p className="text-muted mb-0 small">You haven't submitted any exams for this course yet.</p>
                      </div>
                    ) : (
                      <div className="table-responsive rounded-4 border">
                        <table className="table table-hover align-middle modern-student-table mb-0">
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
                            {courseSubmissions.map((p) => (
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
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                      Passed
                                    </span>
                                  ) : (
                                    <span className="badge-pill-custom failed">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
