import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllExams, deleteExam, getExamSubmissions, updateExam, getCoursesByTeacher, createCourse, deleteCourse as deleteCourseApi } from '../api/examService';
import { useAuth } from '../hooks/useAuth';
import { showSuccess } from '../services/notify';
import { useDialog } from '../hooks/useDialog';
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
  const { showConfirm } = useDialog();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(() => !!user?.id);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingScoresExamId, setViewingScoresExamId] = useState(() => location.state?.viewScoresExamId || null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [error, setError] = useState('');
  const [errorExamId, setErrorExamId] = useState(null);

  const clearError = () => {
    setError('');
    setErrorExamId(null);
  };

  // Course Management States
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

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
  }, [isEditing, viewingScoresExamId, gradingSubmissionId, selectedCourseId, isCreatingCourse]);

  // Fetches courses and exams from the server and updates local state.
  // Used by event handlers (create course, delete course, toggle publish) to refresh data.
  const loadDashboardData = async () => {
    if (!user?.id) return;
    setError('');
    setErrorExamId(null);
    try {
      // 1. Fetch courses owned by this teacher
      const myCourses = await getCoursesByTeacher(user.id);
      setCourses(myCourses);

      // Select first course if none selected
      setSelectedCourseId(prev => {
        if (!prev && myCourses.length > 0) {
          return myCourses[0].id;
        }
        return prev;
      });

      const myCourseIds = myCourses.map(c => c.id);

      // 2. Fetch all exams and filter to show only those belonging to the teacher's courses
      const allExams = await getAllExams();
      const filteredExams = allExams.filter(e => myCourseIds.includes(e.courseId));
      setExams(filteredExams);

      // 3. Fetch submission counts for each exam
      const counts = {};
      for (const exam of filteredExams) {
        try {
          const subs = await getExamSubmissions(exam.id);
          counts[exam.id] = subs.length;
        } catch {
          counts[exam.id] = 0;
        }
      }
      setSubmissionCounts(counts);
    } catch (err) {
      setError('Error fetching dashboard data: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Initial load of all exams and courses when the component mounts
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const init = async () => {
      try {
        const myCourses = await getCoursesByTeacher(user.id);
        if (!active) return;
        // Reset errors only after the first async result is in
        setError('');
        setErrorExamId(null);
        setCourses(myCourses);
        setSelectedCourseId(prev => (!prev && myCourses.length > 0 ? myCourses[0].id : prev));

        const myCourseIds = myCourses.map(c => c.id);
        const allExams = await getAllExams();
        if (!active) return;
        const filteredExams = allExams.filter(e => myCourseIds.includes(e.courseId));
        setExams(filteredExams);

        const counts = {};
        for (const exam of filteredExams) {
          try {
            const subs = await getExamSubmissions(exam.id);
            counts[exam.id] = subs.length;
          } catch {
            counts[exam.id] = 0;
          }
        }
        if (!active) return;
        setSubmissionCounts(counts);
      } catch (err) {
        if (active) setError('Error fetching dashboard data: ' + (err.message || err));
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => { active = false; };
  }, [user?.id]);

  // Prepares an exam for editing by setting local editing state
  const handleEditClick = (exam) => {
    clearError();
    setSelectedExam(exam);
    setIsEditing(true);
  };

  // Prepares editor for creating a new exam
  const handleCreateClick = () => {
    clearError();
    setSelectedExam(null);
    setIsEditing(true);
  };

  const handleTogglePublishGrades = async (exam) => {
    clearError();
    // Validate: exam must be completed and have submissions
    const status = getExamStatus(exam);
    if (status !== 'Done') {
      setError('Grades can only be published once the exam has accomplished.');
      setErrorExamId(exam.id);
      return;
    }
    if (submissionCounts[exam.id] === 0) {
      setError('Cannot publish grades - no student submissions yet.');
      setErrorExamId(exam.id);
      return;
    }

    try {
      setLoading(true);
      const updated = { ...exam, areGradesPublished: !exam.areGradesPublished };
      await updateExam(updated);
      showSuccess(`Grades ${updated.areGradesPublished ? 'published' : 'unpublished'} successfully.`);
      loadDashboardData();
    } catch (err) {
      setError('Failed to toggle grades publish status: ' + (err.message || err));
      setErrorExamId(exam.id);
      setLoading(false);
    }
  };

  // Prompts for confirmation and deletes the specified exam if confirmed.
  const handleDeleteClick = async (examId) => {
    clearError();
    const confirmed = await showConfirm(
      'Are you sure you want to delete this exam?',
      'This action cannot be undone.'
    );
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
    } catch (err) {
      setError('Failed to delete exam: ' + (err.message || err));
      setErrorExamId(examId);
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
    clearError();
  };

  const onCancel = () => {
    setIsEditing(false);
    setSelectedExam(null);
    clearError();
  };

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!newCourseName.trim() || !newCourseCode.trim()) {
      setError('Course Name and Course Code are required.');
      return;
    }
    try {
      setLoading(true);
      const newCourse = await createCourse(newCourseName.trim(), newCourseCode.trim(), user.id);
      showSuccess(`Course "${newCourseName}" created successfully!`);
      setNewCourseName('');
      setNewCourseCode('');
      setIsCreatingCourse(false);
      if (newCourse?.id) {
        setSelectedCourseId(newCourse.id);
      }
      await loadDashboardData(); // reload courses and exams
    } catch (err) {
      setError(err.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    clearError();
    const confirmed = await showConfirm(
      `Delete course "${courseName}"?`,
      'This will permanently delete all its exams and remove it from student enrollments.'
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteCourseApi(courseId);
      showSuccess(`Course "${courseName}" deleted successfully.`);

      const nextCourses = courses.filter(c => c.id !== courseId);
      if (nextCourses.length > 0) {
        setSelectedCourseId(nextCourses[0].id);
      } else {
        setSelectedCourseId(null);
      }
      
      await loadDashboardData();
    } catch (err) {
      setError('Failed to delete course: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const totalExams = exams.length;
  const activeExams = exams.filter(e => {
    const s = getExamStatus(e);
    return s === 'Published' || s === 'Scheduled';
  }).length;
  const totalSubmissions = Object.values(submissionCounts).reduce((sum, count) => sum + count, 0);
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'T';
  const avatarContent = user?.avatar && user.avatar !== 'initials' ? user.avatar : firstLetter;
  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(courseSearchQuery.toLowerCase())
  );

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
            background: linear-gradient(135deg, #0f172a, #0f172a) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 20px !important;
            color: #ffffff;
            box-shadow: 0 15px 30px rgba(15, 23, 42, 0.12) !important;
        }

        .welcome-avatar {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: var(--theme-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            text-align: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 25px;
            border: 2.5px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 16px var(--theme-glow);
            flex-shrink: 0;
            overflow: hidden;
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
            color: rgba(255, 255, 255, 0.6);
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
            border-color: var(--theme-color);
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
            background: var(--theme-glow);
            border: 1px solid var(--theme-color);
            color: var(--theme-color);
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-green:hover:not(:disabled) {
            background: var(--theme-color);
            color: #ffffff;
            border-color: var(--theme-color);
            transform: translateY(-1px);
            box-shadow: 0 4px 10px var(--theme-glow);
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
            background: var(--theme-glow);
            border: 1px solid var(--theme-color);
            color: var(--theme-color);
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-indigo:hover:not(:disabled) {
            background: var(--theme-gradient);
            color: #ffffff;
            border-color: var(--theme-color);
            transform: translateY(-1px);
            box-shadow: 0 4px 10px var(--theme-glow);
        }

        .btn-action-blue {
            background: var(--theme-glow);
            border: 1px solid var(--theme-color);
            color: var(--theme-color);
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-action-blue:hover:not(:disabled) {
            background: var(--theme-gradient);
            color: #ffffff;
            border-color: var(--theme-color);
            transform: translateY(-1px);
            box-shadow: 0 4px 10px var(--theme-glow);
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

        .alert-modern-error {
            background: rgba(244, 63, 94, 0.07);
            border: 1px solid rgba(244, 63, 94, 0.15);
            color: #e11d48;
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideDown 0.4s ease-out;
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
            background: var(--theme-gradient);
            border: none;
            color: white;
            font-weight: 600;
            box-shadow: 0 4px 12px var(--theme-glow);
            transition: all 0.2s ease;
        }
        .btn-save-exam:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px var(--theme-glow);
            color: white;
        }
        .btn-cancel-exam {
            background: rgba(148, 163, 184, 0.06);
            border: 1px solid rgba(148, 163, 184, 0.18);
            color: #475569;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-cancel-exam:hover {
            background: rgba(148, 163, 184, 0.12);
            color: #1e293b;
            transform: translateY(-1px);
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
            border-color: var(--theme-color);
            background: #ffffff;
            outline: none;
            box-shadow: 0 0 0 3px var(--theme-glow);
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
            border-color: var(--theme-glow);
        }
        .sidebar-course-item.active {
            background: var(--theme-gradient);
            color: #ffffff !important;
            border-color: var(--theme-color);
            box-shadow: 0 4px 12px var(--theme-glow);
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
            background: var(--theme-glow);
            border: 1px dashed var(--theme-color);
            color: var(--theme-color);
            font-weight: 600;
            font-size: 13px;
            border-radius: 10px;
            padding: 8px 14px;
            width: 100%;
            transition: all 0.2s ease;
            border-style: dashed;
        }
        .sidebar-add-course-btn:hover {
            background: var(--theme-glow);
            border-color: var(--theme-color);
            border-style: solid;
        }
        .sidebar-add-exam-btn {
            background: var(--theme-gradient);
            color: #ffffff;
            font-weight: 600;
            font-size: 13.5px;
            border: none;
            border-radius: 12px;
            padding: 10px 16px;
            width: 100%;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px var(--theme-glow);
        }
        .sidebar-add-exam-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px var(--theme-glow);
        }
        .modern-form-control {
            border-radius: 9px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            transition: all 0.3s ease;
            accent-color: var(--theme-color);
        }
        .modern-form-control:focus {
            border-color: var(--theme-color);
            background: #ffffff;
            box-shadow: 0 0 0 3px var(--theme-glow);
        }
      `}</style>

      {/* 1. WELCOME & STATS BANNER */}
      <div className="card welcome-header-card p-4 mb-4 border-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="col-md-7 d-flex align-items-center gap-3 text-start p-3">
            <div className="welcome-avatar">{avatarContent}</div>
            <div>
              <h4 className="mb-1 fw-bold">Welcome back, {user?.name || 'Teacher'}!</h4>
              <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Teacher Dashboard | Manage exams and grade student submissions</p>
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

      {/* 2. Side-by-Side Sidebar and Content Area */}
      <div className="row g-4">
        {/* Left Side: Course Sidebar */}
        <div className="col-lg-3 col-md-4">
          <div className="course-sidebar text-start">
            <h5 className="fw-bold mb-2 text-dark">My Courses</h5>

            {/* Action Buttons at the Top */}
            <div className="d-flex flex-column gap-2">
              <button
                className="sidebar-add-course-btn"
                onClick={() => {
                  setIsCreatingCourse(true);
                  setIsEditing(false);
                  setViewingScoresExamId(null);
                  setGradingSubmissionId(null);
                }}
              >
                + Add Course
              </button>
              <button
                className="sidebar-add-exam-btn"
                onClick={() => {
                  handleCreateClick();
                }}
                disabled={courses.length === 0}
              >
                + Create Exam
              </button>

            </div>
            <hr className="m-0" />
            {courses.length > 0 && (
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

            {courses.length === 0 ? (
              <div className="text-muted small my-auto">No courses found.</div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-muted small my-3">No matching courses.</div>
            ) : (
              <ul className="sidebar-course-list">
                {filteredCourses.map(c => (
                  <li
                    key={c.id}
                    className={`sidebar-course-item ${selectedCourseId === c.id && !isCreatingCourse ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setIsCreatingCourse(false);
                      setIsEditing(false);
                      setViewingScoresExamId(null);
                      setGradingSubmissionId(null);
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
          {gradingSubmissionId ? (
            <GradeSubmissionViewer
              submissionId={gradingSubmissionId}
              onBack={() => setGradingSubmissionId(null)}
            />
          ) : isEditing ? (
            <ExamEditor
              key={selectedExam ? selectedExam.id : 'new-exam'}
              exam={selectedExam}
              exams={exams}
              onSaveSuccess={onSaveSuccess}
              onCancel={onCancel}
              defaultCourseId={selectedCourseId}
            />
          ) : viewingScoresExamId ? (
            <ExamScoresViewer
              examId={viewingScoresExamId}
              onBack={() => setViewingScoresExamId(null)}
              onGrade={(subId) => setGradingSubmissionId(subId)}
            />
          ) : isCreatingCourse ? (
            // Course Creation Form
            <div className="card portal-glass-card border-0 p-4 p-md-5 text-start">
              <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Create a New Course</h5>
              <p className="text-muted small mb-4">Add a new course to organize syllabus, tests, and student metrics.</p>

              <form onSubmit={handleCreateCourseSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">Course Name</label>
                  <input
                    type="text"
                    className="form-control form-control-md modern-form-control"
                    placeholder="e.g. Advanced Python Programming"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    style={{ height: '44px' }}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary mb-1">Course Code</label>
                  <input
                    type="text"
                    className="form-control form-control-md modern-form-control"
                    placeholder="e.g. PY-201"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    style={{ height: '44px' }}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-save-exam py-2 px-4 rounded-3 btn-sm">
                    Save Course
                  </button>
                  <button
                    type="button"
                    className="btn btn-cancel-exam py-2 px-4 rounded-3 btn-sm"
                    onClick={() => {
                      setIsCreatingCourse(false);
                      clearError();
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {error && !errorExamId && (
                  <div className="alert alert-danger alert-modern-error mt-3 mb-0 py-2 px-3">
                    <div className="d-flex align-items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </form>
            </div>
          ) : (
            // Default: Exam list for selected course
            (() => {
              const currentCourse = courses.find(c => c.id === selectedCourseId);
              const courseExams = exams.filter(e => e.courseId === selectedCourseId);

              return (
                <div className="card portal-glass-card border-0">
                  <div className="card-body p-4 p-md-5">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 text-start">
                      <div>
                        {currentCourse ? (
                          <>
                            <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
                              {currentCourse.name}
                            </h5>
                            <p className="text-muted small mb-0">
                              Course Code: <span className="fw-bold">{currentCourse.code}</span> | Manage assessments and student submissions
                            </p>
                          </>
                        ) : (
                          <>
                            <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Manage Exams</h5>
                            <p className="text-muted small mb-0">Select a course from the left sidebar to view and manage exams</p>
                          </>
                        )}
                      </div>
                      {currentCourse && (
                        <div>
                          <button
                            className="btn btn-outline-danger py-1.5 px-3 rounded-3 fw-semibold btn-sm d-flex align-items-center gap-1.5"
                            onClick={() => handleDeleteCourse(currentCourse.id, currentCourse.name)}
                            style={{ borderStyle: 'solid', fontSize: '12px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            Delete Course
                          </button>
                        </div>
                      )}
                    </div>

                    {loading ? (
                      <div className="text-center my-5 py-4">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted mt-2 small">Loading exams list...</p>
                      </div>
                    ) : courseExams.length === 0 ? (
                      <div className="text-center my-5 py-4">
                        <p className="text-muted mb-3">No exams found for this course.</p>
                        <button className="btn btn-save-exam py-2 px-4 rounded-3 btn-sm" onClick={handleCreateClick}>
                          + Create First Exam
                        </button>
                      </div>
                    ) : (
                      <div className="exams-list-container">
                        {error && !errorExamId && (
                          <div className="alert alert-danger alert-modern-error mb-4 py-2 px-3">
                            <div className="d-flex align-items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              <span>{error}</span>
                            </div>
                          </div>
                        )}
                        {courseExams.map((exam) => {
                          const status = getExamStatus(exam);
                          const subCount = submissionCounts[exam.id] || 0;

                          return (
                            <div key={exam.id} className="exam-item-card text-start">
                              <div className="d-flex row gap-1 text-start">
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
                              {error && errorExamId === exam.id && (
                                <div className="alert alert-danger alert-modern-error mt-3 mb-0 py-2 px-3 w-100">
                                  <div className="d-flex align-items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="12" y1="8" x2="12" y2="12"></line>
                                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span>{error}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
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

export default TeacherDashboard;
