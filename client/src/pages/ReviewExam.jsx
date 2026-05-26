import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamById, getStudentSubmission } from '../api/examService';
import { useAuth } from '../context/AuthContext';
import { showError } from '../services/notify';

/**
 * ReviewExam Component
 * Displays a detailed review of a student's exam submission, including correct and incorrect answers.
 * It is used by both students (to review their own exams) and teachers (to review specific students).
 */
const ReviewExam = () => {
  const { id, studentName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // If a teacher provides a specific studentName in the URL, use that. Otherwise, default to the logged-in student.
  const targetStudent = studentName || user.name;

  /**
   * Fetches both the exam details and the specific student's submission in parallel.
   * Handles loading states and error notifications if the fetch fails.
   */
  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const [fetchedExam, fetchedSubmission] = await Promise.all([
          getExamById(id),
          getStudentSubmission(id, targetStudent)
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
  }, [id, targetStudent]);

  /**
   * Navigates the user back to their respective dashboard based on their role.
   * Teachers return to the specific exam's scores view, students return to the main student portal.
   */
  const handleBack = () => {
    if (user.role === 'teacher') {
      navigate('/teacher', { state: { returnToScoresFor: id } });
    } else {
      navigate('/student');
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading exam review...</p>
      </div>
    );
  }

  if (!exam || !submission) {
    return (
      <div className="container mt-5 text-center">
        <h4 className="text-danger">Failed to load exam review.</h4>
        <button className="btn btn-primary mt-3" onClick={handleBack}>
          {user.role === 'teacher' ? 'Back to Scores' : 'Back to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow rounded-4">
        <div className="card-header bg-primary text-white p-4 rounded-top-4 d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-0">Review: {exam.title}</h3>
            <small>Score for {targetStudent}: {submission.score}%</small>
          </div>
          <button className="btn btn-outline-light" onClick={handleBack}>
            {user.role === 'teacher' ? 'Back to Scores' : 'Back to Dashboard'}
          </button>
        </div>
        <div className="card-body p-4 p-md-5">
          {exam.questions.map((q, qIndex) => {
            // Retrieve the specific answer the student provided for this question
            const studentAnswer = submission.answers[q.id || qIndex];
            
            return (
              <div key={q.id || qIndex} className="card mb-4 border-secondary rounded-4">
                <div className="card-body bg-light rounded-4 p-4">
                  <h5 className="mb-3">
                    <span className="badge bg-secondary me-2">Q{qIndex + 1}</span>
                    {q.text}
                  </h5>

                  {(!q.type || q.type === 'multiple_choice') ? (
                    <div className="ps-3">
                      {q.options.map((opt, oIndex) => {
                        let textClass = 'text-dark';
                        let icon = '';
                        let bgColor = '';

                        // Determine styling and icons based on whether the option is correct, selected by the student, or both
                        if (oIndex === q.answer && oIndex === studentAnswer) {
                          textClass = 'text-success fw-bold';
                          icon = ' ✓';
                          bgColor = 'bg-success-subtle';
                        } else if (oIndex === q.answer && oIndex !== studentAnswer) {
                          textClass = 'text-success fw-bold';
                          icon = ' (Correct Answer)';
                          bgColor = 'bg-success-subtle';
                        } else if (oIndex === studentAnswer && oIndex !== q.answer) {
                          textClass = 'text-danger fw-bold';
                          icon = ' ✗ (Your Answer)';
                          bgColor = 'bg-danger-subtle';
                        }

                        return (
                          <div key={oIndex} className={`form-check mb-2 p-2 rounded ${bgColor}`}>
                            <input
                              type="radio"
                              className="form-check-input"
                              checked={studentAnswer === oIndex}
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
                    <div className="ps-3">
                      <p className="mb-1 text-muted small">Your Answer:</p>
                      <div className="p-3 bg-white border rounded">
                        {studentAnswer || <span className="text-muted fst-italic">No answer provided</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewExam;