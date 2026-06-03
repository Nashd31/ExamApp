import { useState, useEffect } from 'react';
import { getExamById, getStudentSubmission } from '../api/examService';
import { showError } from '../services/notify';

/**
 * ReviewExamViewer Component
 * Renders the exam review panel inline on the student portal.
 * Shows correct answers, student choices, and points awarded.
 */
const ReviewExamViewer = ({ examId, studentName, onBack }) => {
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const [fetchedExam, fetchedSubmission] = await Promise.all([
          getExamById(examId),
          getStudentSubmission(examId, studentName)
        ]);
        setExam(fetchedExam);
        setSubmission(fetchedSubmission);
      } catch (error) {
        showError('Error loading review data: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    };
    fetchReviewData();
  }, [examId, studentName]);

  if (loading) {
    return (
      <div className="card portal-glass-card border-0 ">
        <div className="card-body text-center p-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--theme-color)' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2 small">Loading exam review...</p>
        </div>
      </div>
    );
  }

  if (!exam || !submission) {
    return (
      <div className="card portal-glass-card border-0">
        <div className="card-body p-4">
          <div className="alert alert-danger mb-3">Failed to load exam review details.</div>
          <button className="btn btn-primary" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const passGrade = exam.passGrade || submission.passGrade || 60;
  const isPassed = submission.score >= passGrade;

  return (
    <div className="card portal-glass-card border-0 overflow-hidden review-viewer-container">
      <style>{`
        .review-viewer-container {
            animation: fadeInReview 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
            font-family: 'Outfit', 'Inter', sans-serif;
        }
        @keyframes fadeInReview {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .review-header-card {
            background: var(--theme-gradient) !important;
            color: #ffffff;
            box-shadow: 0 10px 25px var(--theme-glow) !important;
            border-radius: 20px 20px 0 0 !important;
        }
        .review-body-card {
            background: rgba(255, 255, 255, 0.6) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.45) !important;
            border-top: none !important;
            border-radius: 0 0 20px 20px !important;
            box-shadow: 0 15px 35px rgba(30, 41, 59, 0.04) !important;
        }
        .review-avatar-badge {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: var(--theme-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 24px;
            border: 2.5px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 16px var(--theme-glow);
            flex-shrink: 0;
        }
        .review-score-pill {
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
        .review-score-pill.fail {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.25);
            color: #e11d48;
        }
        .question-review-card {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 16px;
            transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .question-review-card:hover {
            transform: translateY(-1px);
            background: #ffffff;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
            border-color: rgba(16, 185, 129, 0.25);
        }
        .option-review-success {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .option-review-danger {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
      `}</style>

      {/* Header panel */}
      <div className="card review-header-card border-0 p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3 text-start">
            <div>
              <h4 className="mb-0 fw-bold text-white">Review: {exam.title}</h4>
            </div>
          </div>
          <button className="btn btn-outline-light px-4 rounded-3 fw-semibold btn-sm" onClick={onBack}>
            Back to Portal
          </button>
        </div>
      </div>

      {/* Body panel */}
      <div className="card review-body-card border-0">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 border-bottom pb-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Evaluation Review</h5>
              <p className="text-muted small mb-0">Check correct answers and read feedback on your test performance.</p>
            </div>
            <div className={`review-score-pill ${isPassed ? '' : 'fail'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isPassed ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </>
                )}
              </svg>
              <span>Grade: {submission.score}% ({isPassed ? 'Passed' : 'Failed'})</span>
            </div>
          </div>

          <div className="questions-review-list">
            {exam.questions.map((q, qIndex) => {
              const studentAnswer = submission.answers[q.id || qIndex];
              const key = q.id || qIndex;
              let earnedPoints = 0;

              if (submission.manualGrades && submission.manualGrades[key] !== undefined) {
                earnedPoints = submission.manualGrades[key];
              } else if (!q.type || q.type === 'multiple_choice') {
                const expected = q.correctAnswers || [];
                const given = submission.answers[key] || [];
                if (Array.isArray(expected) && Array.isArray(given)) {
                  const isCorrect = expected.length === given.length && expected.every(val => given.includes(val));
                  earnedPoints = isCorrect ? (q.points || 0) : 0;
                }
              }

              const isPerfect = earnedPoints === q.points;
              const hasPartial = earnedPoints > 0 && earnedPoints < q.points;

              return (
                <div key={key} className="card question-review-card mb-4 shadow-sm border-0">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                      <h5 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '16px' }}>
                        <span className="badge bg-secondary me-2">Q{qIndex + 1}</span>
                        {q.text}
                      </h5>
                      <span className={`badge ${isPerfect ? 'bg-success' : hasPartial ? 'bg-warning text-dark' : 'bg-danger'} px-3 py-1.5 rounded-pill`} style={{ fontSize: '12px' }}>
                        Points: {earnedPoints} / {q.points}
                      </span>
                    </div>

                    {(!q.type || q.type === 'multiple_choice') ? (
                      <div className="ps-2">
                        {q.options.map((opt, oIndex) => {
                          let optionClass = 'bg-light text-dark border';
                          let iconSymbol = null;
                          const correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : [q.answer].filter((v) => v !== undefined);
                          const selectedAnswers = Array.isArray(studentAnswer) ? studentAnswer : (studentAnswer !== undefined ? [studentAnswer] : []);
                          const isCorrectOption = correctAnswers.includes(oIndex);
                          const isSelectedOption = selectedAnswers.includes(oIndex);

                          if (isCorrectOption && isSelectedOption) {
                            optionClass = 'option-review-success text-success fw-bold';
                            iconSymbol = (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="me-2 text-success">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            );
                          } else if (isCorrectOption) {
                            optionClass = 'option-review-success text-success opacity-75';
                            iconSymbol = <span className="me-2 small">(Correct Answer)</span>;
                          } else if (isSelectedOption) {
                            optionClass = 'option-review-danger text-danger fw-bold';
                            iconSymbol = (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="me-2 text-danger">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            );
                          }

                          return (
                            <div key={oIndex} className={`d-flex align-items-center p-3 mb-2 rounded-3 border ${optionClass}`} style={{ transition: 'all 0.2s' }}>
                              <input
                                type="checkbox"
                                className="form-check-input me-3"
                                checked={isSelectedOption}
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
                      <div className="ps-2">
                        <p className="mb-2 text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                          Your Submitted Answer
                        </p>
                        <div className="p-3 bg-white border rounded-3" style={{ minHeight: '80px', border: '1.5px solid rgba(148, 163, 184, 0.2) !important' }}>
                          {studentAnswer ? (
                            <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                              {studentAnswer}
                            </p>
                          ) : (
                            <span className="text-muted fst-italic small">No response was submitted for this question.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Render Teacher Notes if available */}
                    {submission.teacherNotes && submission.teacherNotes[key] && (
                      <div className="mt-3 p-3 rounded-3 border-start border-4 border-success bg-success-subtle text-success-emphasis" style={{ backgroundColor: 'rgba(25, 135, 84, 0.08)' }}>
                        <h6 className="fw-bold mb-1 d-flex align-items-center" style={{ fontSize: '13px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          Teacher Feedback:
                        </h6>
                        <p className="mb-0 text-dark opacity-90" style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap' }}>
                          {submission.teacherNotes[key]}
                        </p>
                      </div>
                    )}
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

export default ReviewExamViewer;
