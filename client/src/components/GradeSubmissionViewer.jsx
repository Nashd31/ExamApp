import { useState, useEffect } from 'react';
import { getSubmissionById, getExamById, updateSubmissionGrade } from '../api/examService';
import { showSuccess, showError } from '../services/notify';

/**
 * GradeSubmissionViewer Component
 * Renders the review and grading interface inline on the teacher dashboard.
 * Supports manual grading of questions with live scoring calculations and validation.
 */
const GradeSubmissionViewer = ({ submissionId, onBack }) => {
  const [submission, setSubmission] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState({});
  const [notes, setNotes] = useState({});
  const [savingQuestionId, setSavingQuestionId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subData = await getSubmissionById(submissionId);
        setSubmission(subData);

        const examData = await getExamById(subData.examId);
        setExam(examData);

        // Initialize grades and notes
        const initialGrades = {};
        const initialNotes = {};

        examData.questions.forEach((q, index) => {
          const key = q.id || index;
          initialNotes[key] = (subData.teacherNotes && subData.teacherNotes[key]) || '';
          
          if (subData.manualGrades && subData.manualGrades[key] !== undefined) {
            initialGrades[key] = subData.manualGrades[key];
          } else {
            // Check if auto-graded
            if (!q.type || q.type === 'multiple_choice') {
              const expected = q.correctAnswers || [];
              const given = subData.answers[key] || [];
              if (Array.isArray(expected) && Array.isArray(given)) {
                const isCorrect = expected.length === given.length && expected.every(val => given.includes(val));
                initialGrades[key] = isCorrect ? (q.points || 0) : 0;
              } else {
                initialGrades[key] = 0;
              }
            } else {
              initialGrades[key] = 0;
            }
          }
        });
        setGrades(initialGrades);
        setNotes(initialNotes);
      } catch (err) {
        showError(err.message || 'Error fetching grading data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  const handleGradeChange = (questionId, value) => {
    setGrades(prev => ({ ...prev, [questionId]: value === '' ? '' : Number(value) }));
  };

  const handleNotesChange = (questionId, value) => {
    setNotes(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSaveGrade = async (questionId) => {
    const maxPoints = exam.questions.find((q, idx) => (q.id || idx) === questionId)?.points || 0;
    const awardedPoints = grades[questionId];
    const questionNotes = notes[questionId] || '';

    if (awardedPoints === undefined || awardedPoints === '') {
      showError('Points value cannot be empty.');
      return;
    }
    if (awardedPoints < 0) {
      showError('Points cannot be negative.');
      return;
    }
    if (awardedPoints > maxPoints) {
      showError(`Points cannot exceed ${maxPoints}.`);
      return;
    }

    try {
      setSavingQuestionId(questionId);
      const updatedSub = await updateSubmissionGrade(submissionId, questionId, awardedPoints, questionNotes);
      setSubmission(updatedSub);
      showSuccess('Grade and notes saved successfully');
    } catch (err) {
      showError(err.message || 'Failed to save grade');
    } finally {
      setSavingQuestionId(null);
    }
  };

  if (loading) {
    return (
      <div className="card portal-glass-card border-0">
        <div className="card-body p-5 text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2 small">Loading grading record...</p>
        </div>
      </div>
    );
  }

  if (!submission || !exam) {
    return (
      <div className="card shadow border-0 p-4 rounded-4 text-center bg-white">
        <h5 className="text-danger fw-bold mb-3">Grading record not found.</h5>
        <button className="btn btn-outline-secondary px-4" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const passGrade = exam.passGrade || 60;
  const isPassed = submission.score >= passGrade;
  const studentFirstLetter = submission.studentName ? submission.studentName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="grading-container">
      <style>{`
        .grading-container {
            animation: fadeInGrading 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
            font-family: 'Outfit', 'Inter', sans-serif;
        }
        @keyframes fadeInGrading {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .grading-header-card {
            background: linear-gradient(135deg, #0f172a, #022c22) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 20px 20px 0 0 !important;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08) !important;
        }
        .grading-body-card {
            background: rgba(255, 255, 255, 0.6) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.45) !important;
            border-top: none !important;
            border-radius: 0 0 20px 20px !important;
            box-shadow: 0 15px 35px rgba(30, 41, 59, 0.04) !important;
        }
        .grading-welcome-avatar {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 24px;
            border: 2.5px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
            flex-shrink: 0;
        }
        .grading-score-badge {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.25);
            color: #059669;
            padding: 6px 14px;
            border-radius: 12px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
        }
        .grading-score-badge.fail {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.25);
            color: #e11d48;
        }
        .question-grade-card {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 16px;
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .question-grade-card:hover {
            transform: translateY(-1px);
            background: #ffffff;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
            border-color: rgba(16, 185, 129, 0.25);
        }
        .grade-input-box {
            border-radius: 10px;
            border: 1.5px solid #cbd5e1;
            padding: 6px 12px;
            font-weight: 700;
            color: #1e293b;
            text-align: center;
            transition: all 0.2s ease;
        }
        .grade-input-box:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        .teacher-notes-box {
            transition: all 0.2s ease;
        }
        .teacher-notes-box:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        .btn-grade-save {
            background: #10b981;
            border: none;
            color: #ffffff;
            font-weight: 600;
            padding: 7px 18px;
            border-radius: 10px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-grade-save:hover:not(:disabled) {
            background: #059669;
            transform: translateY(-1px);
            box-shadow: 0 6px 14px rgba(16, 185, 129, 0.22);
        }
        .btn-grade-save:disabled {
            background: #94a3b8;
            cursor: not-allowed;
            box-shadow: none;
        }
        .option-badge-success {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .option-badge-danger {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
      `}</style>

      {/* Header Panel */}
      <div className="card grading-header-card border-0 p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3 text-start">
            <div className="grading-welcome-avatar">{studentFirstLetter}</div>
            <div>
              <h4 className="mb-0 fw-bold text-white">Grading: {exam.title}</h4>
              <p className="mb-0 small" style={{ color: '#a7f3d0' }}>
                Student Name: <strong className="text-white">{submission.studentName}</strong> | Submission ID: {submissionId}
              </p>
            </div>
          </div>
          <button className="btn btn-outline-light px-4 rounded-3 fw-semibold btn-sm" onClick={onBack}>
            Back to Scores
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="card grading-body-card border-0">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 border-bottom pb-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Evaluation Sheets</h5>
              <p className="text-muted small mb-0">Evaluate student answers and adjust points for each question manually.</p>
            </div>
            <div className={`grading-score-badge ${isPassed ? 'pass' : 'fail'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isPassed ? (
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
                {isPassed ? <polyline points="22 4 12 14.01 9 11.01" /> : <line x1="12" y1="8" x2="12" y2="12" />}
                {!isPassed && <line x1="12" y1="16" x2="12.01" y2="16" />}
              </svg>
              <span>Current Score: {submission.score}% ({isPassed ? 'Passed' : 'Failed'})</span>
            </div>
          </div>

          <div className="questions-grading-list">
            {exam.questions.map((q, index) => {
              const key = q.id || index;
              const studentAnswers = Array.isArray(submission.answers[key])
                ? submission.answers[key]
                : (submission.answers[key] !== undefined ? [submission.answers[key]] : []);
              const correctAnswers = q.correctAnswers || [];
              const isSaving = savingQuestionId === key;
              const isPointsInvalid = grades[key] < 0 || grades[key] > q.points;

              return (
                <div key={key} className="card question-grade-card mb-4 shadow-sm border-0">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                      <h5 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '16px' }}>
                        <span className="badge bg-secondary me-2">Q{index + 1}</span>
                        {q.text}
                      </h5>
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1.5" style={{ fontSize: '12px' }}>
                        {q.points} Points Max
                      </span>
                    </div>

                    {/* Render Choices for Multiple Choice Questions */}
                    {(!q.type || q.type === 'multiple_choice') ? (
                      <div className="ps-2 mb-4">
                        <p className="small text-muted mb-3 italic">
                          Multiple choice question. (Correct options are marked)
                        </p>
                        {q.options?.map((opt, oIndex) => {
                          const isCorrectOption = correctAnswers.includes(oIndex);
                          const isStudentSelected = studentAnswers.includes(oIndex);
                          let optionClass = 'bg-light text-dark border';
                          let iconSymbol = null;

                          if (isCorrectOption && isStudentSelected) {
                            optionClass = 'option-badge-success text-success fw-bold';
                            iconSymbol = (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="me-2 text-success">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            );
                          } else if (isCorrectOption && !isStudentSelected) {
                            optionClass = 'option-badge-success text-success opacity-75';
                            iconSymbol = <span className="me-2 small">(Correct)</span>;
                          } else if (!isCorrectOption && isStudentSelected) {
                            optionClass = 'option-badge-danger text-danger fw-bold';
                            iconSymbol = (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="me-2 text-danger">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            );
                          }

                          return (
                            <div key={oIndex} className={`d-flex align-items-center p-3 mb-2 rounded-3 border ${optionClass}`} style={{ transition: 'all 0.2s' }}>
                              <input
                                type={q.allowMultipleAnswers ? 'checkbox' : 'radio'}
                                className="form-check-input me-3"
                                checked={isStudentSelected}
                                readOnly
                                disabled
                                style={{ transform: 'scale(1.15)', cursor: 'not-allowed' }}
                              />
                              <div className="d-flex align-items-center">
                                {iconSymbol}
                                <span style={{ fontSize: '14.5px' }}>{opt}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Render student answers for Open Ended Questions */
                      <div className="ps-2 mb-4">
                        <p className="mb-2 text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                          Student's Answer Details
                        </p>
                        <div className="p-3 bg-white border rounded-3 shadow-inner" style={{ minHeight: '80px', border: '1.5px solid rgba(148, 163, 184, 0.2) !important' }}>
                          {studentAnswers[0] ? (
                            <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                              {studentAnswers[0]}
                            </p>
                          ) : (
                            <span className="text-muted fst-italic small">No student response submitted.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Teacher Notes Section */}
                    <div className="ps-2 mb-3 mt-3 border-top pt-3">
                      <label className="form-label text-secondary fw-semibold small mb-1" style={{ fontSize: '13px' }}>
                        Teacher Notes / Feedback
                      </label>
                      <textarea
                        className="form-control teacher-notes-box"
                        rows="2"
                        placeholder="Add teacher notes or feedback for this question..."
                        value={notes[key] || ''}
                        onChange={(e) => handleNotesChange(key, e.target.value)}
                        style={{
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13.5px',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Grading Section */}
                    <div className="border-top pt-3 mt-3 d-flex align-items-center justify-content-between flex-wrap gap-3 bg-light p-3 rounded-3">
                      <div className="d-flex align-items-center gap-3">
                        <label className="mb-0 text-secondary fw-semibold" style={{ fontSize: '13.5px' }}>
                          Points Awarded:
                        </label>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="number"
                            className="form-control grade-input-box"
                            style={{ width: '90px' }}
                            min="0"
                            max={q.points}
                            value={grades[key] === undefined ? '' : grades[key]}
                            onChange={(e) => handleGradeChange(key, e.target.value)}
                          />
                          <span className="text-muted small">/ {q.points} max</span>
                        </div>
                      </div>

                      <button
                        className="btn btn-grade-save"
                        onClick={() => handleSaveGrade(key)}
                        disabled={isPointsInvalid || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Save Grade & Notes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmissionViewer;
