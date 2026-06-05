import { useState, useEffect } from 'react';
import { createExam, updateExam, getCoursesByTeacher } from '../api/examService';
import { showSuccess } from '../services/notify';
import { getExamStatus } from '../utils/examUtils';
import { useAuth } from '../hooks/useAuth';
import { logError } from '../services/logger';
import CustomDateTimePicker from './CustomDateTimePicker';

/**
 * ExamEditor Component
 * Provides the interface for creating or editing a single exam.
 * Features a live points progress bar validation and custom styled inputs.
 */
const ExamEditor = ({ exam, exams, onSaveSuccess, onCancel, defaultCourseId }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState(null);
  const [editingExam, setEditingExam] = useState(() => {
    if (exam) {
      return JSON.parse(JSON.stringify(exam));
    }
    return {
      title: 'New Exam',
      duration: 60,
      passGrade: 50,
      startDate: '',
      endDate: '',
      courseId: defaultCourseId || '',
      areGradesPublished: false,
      questions: [
        {
          id: `q${Date.now()}`,
          type: 'multiple_choice',
          text: 'New Question',
          allowMultipleAnswers: false,
          options: ['Option 1', 'Option 2'],
          correctAnswers: [0],
          points: 10
        }
      ],
      isNew: true
    };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [openQuestionTypeDropdownIndex, setOpenQuestionTypeDropdownIndex] = useState(null);

  useEffect(() => {
    const handleDocumentClick = () => {
      setCourseDropdownOpen(false);
      setOpenQuestionTypeDropdownIndex(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const toggleCourseDropdown = (e) => {
    e.stopPropagation();
    setCourseDropdownOpen(!courseDropdownOpen);
    setOpenQuestionTypeDropdownIndex(null);
  };

  const toggleQuestionTypeDropdown = (e, index) => {
    e.stopPropagation();
    setOpenQuestionTypeDropdownIndex(prev => prev === index ? null : index);
    setCourseDropdownOpen(false);
  };

  const selectQuestionType = (qIndex, newType) => {
    setEditingExam(prev => {
      const updatedQuestions = [...prev.questions];
      // shallow copy the specific question object to avoid mutating state directly
      const q = { ...updatedQuestions[qIndex] };
      q.type = newType;
      if (newType === 'multiple_choice') {
        if (!q.options) {
          q.options = ['Option 1', 'Option 2'];
        }
        q.correctAnswers = q.correctAnswers || [0];
        q.allowMultipleAnswers = q.allowMultipleAnswers || false;
      }
      updatedQuestions[qIndex] = q;
      return { ...prev, questions: updatedQuestions };
    });
    setOpenQuestionTypeDropdownIndex(null);
  };

  const selectCourse = (courseId) => {
    setEditingExam(prev => ({ ...prev, courseId }));
    setCourseDropdownOpen(false);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (user?.id) {
        try {
          const data = await getCoursesByTeacher(user.id);
          setCourses(data);
          // If editing a new exam, set its courseId to the default course or first course by default
          setEditingExam(prev => {
            if (!prev.courseId && data.length > 0) {
              const initialCourseId = defaultCourseId && data.some(c => c.id === defaultCourseId) ? defaultCourseId : data[0].id;
              return { ...prev, courseId: initialCourseId };
            }
            return prev;
          });
        } catch (err) {
          logError("Failed to fetch courses", err.message);
        }
      }
    };
    fetchCourses();
  }, [user, defaultCourseId]);

  // Updates the title of the exam currently being edited.
  const handleTitleChange = (e) => {
    setEditingExam({ ...editingExam, title: e.target.value });
  };

  // Updates a specific field (text, type, answer, etc.) of a question within the exam currently being edited.
  const handleQuestionChange = (qIndex, field, value) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex][field] = value;
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  // Updates the text of a specific option within a multiple-choice question.
  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  // Appends a new blank option to a multiple-choice question.
  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex].options.push('New Option');
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  /**
   * Removes a specific option from a multiple-choice question.
   * Adjusts the correct answer index if the removed option shifts the indexes.
   */
  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = [...editingExam.questions];
    if (updatedQuestions[qIndex].options.length > 2) {
      updatedQuestions[qIndex].options.splice(oIndex, 1);
      // Adjust the selected correct answers to ensure validity
      const oldAnswers = updatedQuestions[qIndex].correctAnswers || [];
      const newAnswers = oldAnswers
        .filter(ans => ans !== oIndex)
        .map(ans => ans > oIndex ? ans - 1 : ans);
      updatedQuestions[qIndex].correctAnswers = newAnswers.length > 0 ? newAnswers : [0];
      setEditingExam({ ...editingExam, questions: updatedQuestions });
    }
  };

  // Appends a new default multiple-choice question to the current exam.
  const handleAddQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      text: 'New Question',
      type: 'multiple_choice',
      allowMultipleAnswers: false,
      options: ['Option 1', 'Option 2'],
      correctAnswers: [0],
      points: 10
    };

    setEditingExam({
      ...editingExam,
      questions: [...editingExam.questions, newQuestion]
    });
  };

  // Removes a specific question from the current exam.
  const handleRemoveQuestion = (qIndex) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions.splice(qIndex, 1);
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  // Persists the currently edited exam (either creating a new one or updating an existing one).
  const handleSave = async () => {
    setError('');
    if (!editingExam.courseId) {
      setError('Please select a course for this exam.');
      return;
    }
    if (!editingExam.startDate || !editingExam.endDate) {
      setError('Start date and End date are required.');
      return;
    }

    const start = new Date(editingExam.startDate);
    const end = new Date(editingExam.endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Invalid start or end date.');
      return;
    }

    if (end <= start) {
      setError('End date must be strictly after the start date.');
      return;
    }

    // Start time cannot be in the past (with a 1-minute grace buffer for completion lag)
    if (start.getTime() < now.getTime() - 60000) {
      setError('Start time cannot be before the current time.');
      return;
    }

    // Check if trying to edit an active or completed exam (except when creating)
    if (!editingExam.isNew && editingExam.id) {
      const originalExam = exams.find(e => e.id === editingExam.id);
      if (originalExam) {
        const origStatus = getExamStatus(originalExam);
        if (origStatus === 'Published' || origStatus === 'Done') {
          setError('Cannot edit an exam that is currently active or completed.');
          return;
        }
      }
    }

    try {
      setLoading(true);
      let savedExam;
      const isNew = editingExam.isNew || !editingExam.id;
      if (isNew) {
        const newExamData = { ...editingExam };
        delete newExamData.isNew;
        savedExam = await createExam(newExamData);
      } else {
        savedExam = await updateExam(editingExam);
      }

      showSuccess('Exam: "' + savedExam.title + '" saved successfully.');
      onSaveSuccess(savedExam, isNew);
    } catch (err) {
      setError('Failed to save: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = editingExam.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  return (
    <div className="card portal-glass-card border-0">
      <style>{`
        .editor-header-card {
            background: var(--theme-gradient) !important;
            color: #ffffff;
            box-shadow: 0 10px 25px var(--theme-glow) !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
        }

        .custom-dropdown-container {
            position: relative;
            width: 100%;
        }
        .custom-dropdown-trigger {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            border-radius: 9px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            color: #1e293b;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            text-align: left;
        }
        .custom-dropdown-trigger:focus, .custom-dropdown-trigger.open {
            border-color: var(--theme-color);
            background: #ffffff;
            box-shadow: 0 0 0 3px var(--theme-glow);
            outline: none;
        }
        .custom-dropdown-menu {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
            z-index: 1000;
            max-height: 240px;
            overflow-y: auto;
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            animation: dropdownSlideIn 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes dropdownSlideIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .custom-dropdown-item {
            padding: 10px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13.5px;
            color: #334155;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
        }
        .custom-dropdown-item:hover {
            background-color: var(--theme-glow);
            color: var(--theme-color);
        }
        .custom-dropdown-item.active {
            background: var(--theme-gradient);
            color: #ffffff;
            font-weight: 600;
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
        .points-progress-card {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(148, 163, 184, 0.15);
            border-radius: 14px;
            padding: 16px 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
        }
        .progress-bar-container {
            height: 8px;
            background-color: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        .progress-bar-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), background-color 0.3s ease;
        }
        .bg-progress-success {
            background: var(--theme-gradient);
            box-shadow: 0 0 8px var(--theme-glow);
        }
        .bg-progress-warning {
            background: linear-gradient(90deg, #f59e0b, #d97706);
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
        }
        .bg-progress-danger {
            background: linear-gradient(90deg, #ef4444, #dc2626);
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
        }

        .question-creator-card {
            border: 1px solid rgba(148, 163, 184, 0.15) !important;
            border-radius: 14px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
            overflow: hidden;
            transition: all 0.25s ease;
        }
        .question-creator-card:hover {
            border-color: var(--theme-glow) !important;
            box-shadow: 0 6px 18px var(--theme-glow) !important;
        }
        .question-card-header {
            background: rgba(148, 163, 184, 0.03) !important;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1) !important;
            padding: 12px 20px !important;
        }

        .form-check-input:checked {
            background-color: var(--theme-color) !important;
            border-color: var(--theme-color) !important;
        }
        .form-check-input:focus {
            border-color: var(--theme-color) !important;
            box-shadow: 0 0 0 3px var(--theme-glow) !important;
        }

        .option-input-group {
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
            transition: border-color 0.2s ease;
            width: 100%;
        }
        .option-input-group:focus-within {
            border-color: var(--theme-color);
            box-shadow: 0 0 0 3px var(--theme-glow);
        }
        .option-group-text {
            background-color: rgba(148, 163, 184, 0.04);
            border: none;
            border-right: 1px solid rgba(148, 163, 184, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
        }
        .option-control-input {
            border: none !important;
            border-radius: 0 !important;
            height: 36px;
            background: transparent !important;
            padding-left: 10px;
            font-size: 14px;
        }
        .option-control-input:focus {
            box-shadow: none !important;
        }
        .option-remove-btn {
            border: none;
            background: transparent;
            color: #94a3b8;
            padding: 0 12px;
            transition: color 0.2s, background-color 0.2s;
            border-left: 1px solid rgba(148, 163, 184, 0.15);
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .option-remove-btn:hover:not(:disabled) {
            color: #e11d48;
            background-color: rgba(244, 63, 94, 0.05);
        }
        .option-remove-btn:disabled {
            color: #cbd5e1;
            cursor: not-allowed;
        }

        .btn-add-option {
            color: var(--theme-color);
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            border: none;
            background: transparent;
            padding: 4px 8px;
            border-radius: 6px;
        }
        .btn-add-option:hover {
            color: var(--theme-color);
            background-color: var(--theme-glow);
        }

        .btn-add-question {
            background: var(--theme-glow);
            border: 1px dashed var(--theme-color);
            color: var(--theme-color);
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-add-question:hover {
            background: var(--theme-glow);
            border-color: var(--theme-color);
            border-style: solid;
            transform: translateY(-1px);
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
            color: #ffffff;
        }
        .btn-save-exam:disabled {
            background: var(--theme-gradient);
            cursor: not-allowed;
            box-shadow: none;
            color: #ffffff;
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

        .modern-alert {
            border-radius: 10px;
            border: 1px solid rgba(239, 68, 68, 0.2);
            background-color: #fef2f2;
            color: #b91c1c;
            padding: 10px 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.02);
        }
      `}</style>
      
      <div className="card-header editor-header-card d-flex justify-content-between align-items-center p-4 border-0">
        <h4 className="fw-bold mb-0">
          {editingExam.isNew ? 'Create New Exam' : 'Edit Exam'}: <span className="text-warning fw-semibold">{editingExam.title}</span>
        </h4>
        <button className="btn btn-outline-light px-4 rounded-3 fw-semibold btn-sm" onClick={onCancel}>
          Back to List
        </button>
      </div>

      <div className="card-body p-4 p-md-5">
        {/* General Settings */}
        <div className="card border-0 shadow-sm p-4 mb-4 rounded-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <h5 className="fw-bold mb-3" style={{ color: '#1e293b', fontSize: '16px' }}>General Settings</h5>
          
          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary mb-1.5">Exam Title</label>
            <input
              className="form-control form-control-lg modern-form-control"
              style={{ height: '48px', fontSize: '15px' }}
              value={editingExam.title}
              onChange={handleTitleChange}
              placeholder="e.g. Introduction to Computer Science"
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary mb-1.5">Associated Course</label>
            {courses === null ? (
              <div className="text-muted small py-2">
                <span className="spinner-border spinner-border-sm me-2" role="status" style={{ width: '1rem', height: '1rem', color: 'var(--theme-color)' }}></span>
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="text-danger small fw-semibold p-2 border border-danger rounded bg-light">
                ⚠️ You must create a course before creating exams.
              </div>
            ) : (
              (() => {
                const selectedCourse = courses.find(c => c.id === editingExam.courseId);
                const triggerLabel = selectedCourse 
                  ? `${selectedCourse.name} (${selectedCourse.code})` 
                  : '-- Select Course --';

                return (
                  <div className="custom-dropdown-container">
                    <button
                      type="button"
                      className={`custom-dropdown-trigger ${courseDropdownOpen ? 'open' : ''}`}
                      onClick={toggleCourseDropdown}
                    >
                      <span>{triggerLabel}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: courseDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {courseDropdownOpen && (
                      <div className="custom-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        {courses.map(c => (
                          <div
                            key={c.id}
                            className={`custom-dropdown-item ${editingExam.courseId === c.id ? 'active' : ''}`}
                            onClick={() => selectCourse(c.id)}
                          >
                            {c.name} ({c.code})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          <div className="row g-3">
            <div className="col-md-3 col-sm-6">
              <label className="form-label small fw-semibold text-secondary mb-1.5">Duration (mins)</label>
              <input
                type="number"
                min={1}
                className="form-control modern-form-control"
                value={editingExam.duration || 60}
                onChange={(e) => setEditingExam({ ...editingExam, duration: Number(e.target.value) })}
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <label className="form-label small fw-semibold text-secondary mb-1.5">Pass Grade (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="form-control modern-form-control"
                value={editingExam.passGrade || 50}
                onChange={(e) => setEditingExam({ ...editingExam, passGrade: Number(e.target.value) })}
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <CustomDateTimePicker
                label="Start Date & Time"
                value={editingExam.startDate}
                onChange={(val) => setEditingExam({
                  ...editingExam,
                  startDate: val
                })}
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <CustomDateTimePicker
                label="End Date & Time"
                value={editingExam.endDate}
                alignRight={true}
                onChange={(val) => setEditingExam({
                  ...editingExam,
                  endDate: val
                })}
              />
            </div>
          </div>
        </div>

        {/* Validation Indicator */}
        {(() => {
          let progressColorClass;
          let pointsMessage;
          
          if (totalPoints === 100) {
            progressColorClass = 'bg-progress-success';
            pointsMessage = 'Total points: 100% ✓ Perfect!';
          } else if (totalPoints > 100) {
            progressColorClass = 'bg-progress-danger';
            pointsMessage = `Total points: ${totalPoints}% (${totalPoints - 100}% over the required 100% limit)`;
          } else {
            progressColorClass = 'bg-progress-warning';
            pointsMessage = `Total points: ${totalPoints}% (${100 - totalPoints}% remaining to reach 100%)`;
          }

          const fillPercentage = Math.min(totalPoints, 100);

          return (
            <div className="points-progress-card mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-secondary">Exam Points Weight Validation</span>
                <span className={`badge ${totalPoints === 100 ? 'bg-success' : totalPoints > 100 ? 'bg-danger' : 'bg-warning text-dark'} px-2.5 py-1.5`}>
                  {totalPoints} / 100 Points
                </span>
              </div>
              <div className="progress-bar-container mb-2">
                <div className={`progress-bar-fill ${progressColorClass}`} style={{ width: `${fillPercentage}%` }}></div>
              </div>
              <div className="small text-secondary">
                {totalPoints === 100 ? (
                  <span className="text-success fw-semibold">✓ {pointsMessage}</span>
                ) : (
                  <span className="text-muted">{pointsMessage}</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Questions Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0" style={{ color: '#1e293b', fontSize: '16px' }}>Questions</h5>
          <span className="small text-secondary fw-semibold">{editingExam.questions.length} total questions</span>
        </div>

        {/* Questions List */}
        {editingExam.questions.map((q, qIndex) => (
          <div key={q.id} className="card question-creator-card mb-4">
            <div className="card-header question-card-header d-flex justify-content-between align-items-center">
              <span className="fw-bold small text-secondary">Question {qIndex + 1}</span>
              <button className="btn btn-sm btn-outline-danger py-1 px-2.5 rounded-2" style={{ fontSize: '11.5px' }} onClick={() => handleRemoveQuestion(qIndex)}>
                Remove Question
              </button>
            </div>
            <div className="card-body p-4" style={{ backgroundColor: 'rgba(255,255,255,0.45)' }}>
              <div className="d-flex gap-3 mb-3 flex-wrap">
                <div className="flex-grow-1" style={{ minWidth: '250px' }}>
                  <input
                    className="form-control modern-form-control"
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    placeholder="Enter question statement"
                  />
                </div>
                <div style={{ minWidth: '160px', position: 'relative' }}>
                  {(() => {
                    const isOpen = openQuestionTypeDropdownIndex === qIndex;
                    const typeLabel = q.type === 'open_ended' ? 'Open Ended' : 'Multiple Choice';
                    return (
                      <div className="custom-dropdown-container">
                        <button
                          type="button"
                          className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
                          style={{ height: '38px', padding: '0 12px' }}
                          onClick={(e) => toggleQuestionTypeDropdown(e, qIndex)}
                        >
                          <span>{typeLabel}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="custom-dropdown-menu" style={{ top: 'calc(100% + 4px)', minWidth: '160px' }} onClick={(e) => e.stopPropagation()}>
                            <div
                              className={`custom-dropdown-item ${(!q.type || q.type === 'multiple_choice') ? 'active' : ''}`}
                              onClick={() => selectQuestionType(qIndex, 'multiple_choice')}
                            >
                              Multiple Choice
                            </div>
                            <div
                              className={`custom-dropdown-item ${q.type === 'open_ended' ? 'active' : ''}`}
                              onClick={() => selectQuestionType(qIndex, 'open_ended')}
                            >
                              Open Ended
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ maxWidth: '120px' }}>
                  <input
                    type="number"
                    min={0}
                    className="form-control modern-form-control"
                    placeholder="Points"
                    value={q.points || 0}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="ms-1 ms-md-3">
                {(!q.type || q.type === 'multiple_choice') ? (
                  <>
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`multi-answer-toggle-${q.id}`}
                        checked={q.allowMultipleAnswers || false}
                        onChange={(e) => {
                          const allowMulti = e.target.checked;
                          const currentAnswers = q.correctAnswers || [];
                          const newAnswers = allowMulti
                            ? currentAnswers.length > 0 ? currentAnswers : [0]
                            : currentAnswers.length > 0 ? [currentAnswers[0]] : [0];
                          handleQuestionChange(qIndex, 'allowMultipleAnswers', allowMulti);
                          handleQuestionChange(qIndex, 'correctAnswers', newAnswers);
                        }}
                      />
                      <label className="form-check-label small fw-semibold text-secondary" htmlFor={`multi-answer-toggle-${q.id}`}>
                        Allow multiple correct answers
                      </label>
                    </div>
                    
                    <label className="form-label small text-secondary fw-semibold mb-2">
                      Options (Select the correct {q.allowMultipleAnswers ? 'answers' : 'answer'}):
                    </label>
                    
                    {q.options?.map((opt, oIndex) => (
                      <div key={oIndex} className="d-flex option-input-group mb-2">
                        <div className="option-group-text">
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={(q.correctAnswers || []).includes(oIndex)}
                            onChange={(e) => {
                              const currentAnswers = q.correctAnswers || [];
                              let newAnswers;
                              if (q.allowMultipleAnswers) {
                                if (e.target.checked) {
                                  newAnswers = [...currentAnswers, oIndex];
                                } else {
                                  newAnswers = currentAnswers.filter(a => a !== oIndex);
                                }
                              } else {
                                newAnswers = e.target.checked ? [oIndex] : [];
                              }
                              handleQuestionChange(qIndex, 'correctAnswers', newAnswers);
                            }}
                          />
                        </div>
                        <input
                          className="form-control option-control-input"
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        />
                        <button
                          className="option-remove-btn"
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          disabled={q.options.length <= 2}
                          type="button"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    
                    <button className="btn btn-add-option" onClick={() => handleAddOption(qIndex)}>
                      + Add Option
                    </button>
                  </>
                ) : (
                  <textarea
                    className="form-control modern-form-control mt-2"
                    style={{ height: '70px', resize: 'none', backgroundColor: 'rgba(148, 163, 184, 0.05)', color: '#64748b' }}
                    disabled
                    value="Student will write their answer here."
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Error Message */}
        {error && (
          <div className="modern-alert mb-4">
            <span className="d-flex align-items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </span>
            <button type="button" className="btn-close" style={{ fontSize: '10px' }} onClick={() => setError('')} aria-label="Close"></button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-3 justify-content-end align-items-center mt-4 pt-3 border-top">
          <button className="btn btn-add-question py-2 px-4 rounded-3 btn-sm" disabled={loading} onClick={handleAddQuestion}>
            + Add New Question
          </button>
          <button
            className="btn btn-save-exam py-2 px-5 rounded-3 btn-sm"
            onClick={handleSave}
            disabled={totalPoints !== 100 || loading}
          >
            {loading ? (editingExam?.isNew ? 'Creating...' : 'Saving...') : (editingExam?.isNew ? 'Create Exam' : 'Save Changes')}
          </button>
          <button className="btn btn-cancel-exam py-2 px-4 rounded-3 btn-sm" disabled={loading} onClick={onCancel}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExamEditor;
