import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, getExamById, updateSubmissionGrade } from '../api/examService';
import { showSuccess, showError } from '../services/notify';

const GradeSubmission = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subData = await getSubmissionById(submissionId);
        setSubmission(subData);

        const examData = await getExamById(subData.examId);
        setExam(examData);

        // Initialize grades with existing manualGrades or calculate auto-graded points
        const initialGrades = {};

        examData.questions.forEach((q, index) => {
          const key = q.id || index;
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
      } catch (err) {
        showError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  const handleGradeChange = (questionId, value) => {
    setGrades(prev => ({ ...prev, [questionId]: Number(value) }));
  };

  const handleSaveGrade = async (questionId) => {
    const maxPoints = exam.questions.find(q => (q.id || exam.questions.indexOf(q)) === questionId)?.points || 0;
    const awardedPoints = grades[questionId];

    if (awardedPoints < 0) {
      showError('Points cannot be negative.');
      return;
    }
    if (awardedPoints > maxPoints) {
      showError(`Points cannot exceed ${maxPoints}.`);
      return;
    }

    try {
      const updatedSub = await updateSubmissionGrade(submissionId, questionId, awardedPoints);
      setSubmission(updatedSub);
      showSuccess('Grade saved successfully');
    } catch (err) {
      showError(err.message || 'Failed to save grade');
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading data...</p>
      </div>
    );
  }
  if (!submission || !exam) return <div className="container mt-4 alert alert-danger">Data not found.</div>;

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow rounded-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center p-4 rounded-top-4">
          <div>
            <h3 className="mb-0">Grading: {exam.title}</h3>
            <small>Student: {submission.studentName}</small>
          </div>
          <button className="btn btn-outline-light px-4" onClick={() => navigate(`/teacher/exam/${submission.examId}/scores`)}>Back to Scores</button>
        </div>
        <div className="card-body px-5 py-4">
          <h5 className="mb-4">Current Score: <strong>{submission.score}%</strong></h5>
          {exam.questions.map((q, index) => {
            const key = q.id || index;
            const studentAnswers = Array.isArray(submission.answers[key])
              ? submission.answers[key]
              : (submission.answers[key] !== undefined ? [submission.answers[key]] : []);
            const correctAnswers = q.correctAnswers || [];

            return (
              <div key={key} className="card mb-4 border-secondary rounded-4">
                <div className="card-body bg-light rounded-4 p-4">
                  <h5 className="mb-3">
                    <span className="badge bg-secondary me-2">Q{index + 1}</span>
                    {q.text}
                    <span className="badge bg-info ms-2">{q.points} Points</span>
                  </h5>

                  {(!q.type || q.type === 'multiple_choice') ? (
                    <div className="ps-3 mb-4">
                      <p className="small text-muted mb-2">
                        {q.allowMultipleAnswers ? 'Multiple answers question.' : 'Single answer question.'}
                      </p>
                      {q.options?.map((opt, oIndex) => {
                        const isCorrectOption = correctAnswers.includes(oIndex);
                        const isStudentSelected = studentAnswers.includes(oIndex);
                        let bgColor = '';
                        let textClass = 'text-dark';
                        let icon = '';

                        if (isCorrectOption && isStudentSelected) {
                          bgColor = 'bg-success-subtle';
                          textClass = 'text-success fw-bold';
                          icon = ' ✓';
                        } else if (isCorrectOption && !isStudentSelected) {
                          bgColor = 'bg-success-subtle';
                          textClass = 'text-success fw-bold';
                          icon = ' (Correct)';
                        } else if (!isCorrectOption && isStudentSelected) {
                          bgColor = 'bg-danger-subtle';
                          textClass = 'text-danger fw-bold';
                          icon = ' ✗ (Student Selected)';
                        }

                        return (
                          <div key={oIndex} className={`form-check mb-2 p-2 rounded ${bgColor}`}>
                            <input
                              type={q.allowMultipleAnswers ? 'checkbox' : 'radio'}
                              className="form-check-input"
                              checked={isStudentSelected}
                              readOnly
                              disabled
                            />
                            <label className={`form-check-label ${textClass}`}>
                              {opt} {icon}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ps-3 mb-4">
                      <p className="mb-1 text-muted small"><strong>Student's Answer:</strong></p>
                      <div className="p-3 bg-white border rounded">
                        {studentAnswers[0] || <span className="text-muted fst-italic">No answer provided</span>}
                      </div>
                    </div>
                  )}

                  <div className="border-top pt-3">
                    <div className="d-flex align-items-center gap-3">
                      <label className="mb-0"><strong>Points Awarded (out of {q.points}):</strong></label>
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '100px' }}
                        min="0"
                        max={q.points}
                        value={grades[key] === undefined ? '' : grades[key]}
                        onChange={(e) => handleGradeChange(key, e.target.value)}
                      />
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleSaveGrade(key)}
                        disabled={grades[key] < 0 || grades[key] > q.points}
                      >
                        Save Grade
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GradeSubmission;
