import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExamById } from '../api/examService';
import { getStudentSubmissions } from '../api/examService';
import { useAuth } from '../context/AuthContext';
import { showError } from '../services/notify';
import { getExamStatus } from '../utils/examUtils';

/**
 * Renders the Student Portal dashboard.
 * Allows students to search for an exam by ID to take it,
 * and displays a history of their past exam submissions.
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

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow rounded-4">
        <div className="card-header bg-primary text-white p-4 rounded-top-4">
          <h3>Student Portal</h3>
        </div>
        <div className="card-body px-5 py-4">
          <h5 className="card-title mb-1">Welcome, {user?.name || 'Student'}</h5>
          <p className="text-muted mb-4">Enter the Exam ID provided by your teacher to begin.</p>
          <div className="d-flex gap-2 mb-3 w-100">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Exam ID to Start"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            />
            <button
              className="btn btn-primary flex-shrink-0"
              type="button"
              onClick={handleFetchExam}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Exam'}
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Searching for exam...</p>
            </div>
          ) : (
            exam && (
              <div className="mt-4 p-3 border rounded bg-light">
                <h6>Exam: <span className="text-primary">{exam.title}</span></h6>
                <p>Questions available: {exam.questions.length}</p>
                <button
                  className="btn btn-warning w-100"
                  onClick={() => navigate(`/take-exam/${exam.id}`)}
                >
                  Begin Now
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <div className="card shadow rounded-4 mt-4">
        <div className="card-header bg-light p-4 rounded-top-4">
          <h5 className="mb-0">My Past Exams</h5>
        </div>
        <div className="card-body px-4 py-3">
          {loadingPast ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading past exams...</p>
            </div>
          ) : pastExams.length === 0 ? (
            <p className="text-muted">No past exams found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pastExams.map((p) => (
                    <tr key={p.examId}>
                      <td>{p.title}</td>
                      <td>
                        {p.areGradesPublished === false ? (
                          <span className="text-warning">Pending Teacher Review</span>
                        ) : (
                          `${p.score}%`
                        )}
                      </td>
                      <td>
                        {p.areGradesPublished === false ? (
                          <span className="badge bg-secondary">Pending</span>
                        ) : p.score >= p.passGrade ? (
                          <span className="badge bg-success">Passed</span>
                        ) : (
                          <span className="badge bg-danger">Failed</span>
                        )}
                      </td>
                      <td>
                        {p.areGradesPublished !== false && (
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => navigate(`/review-exam/${p.examId}`)}
                          >
                            Review
                          </button>
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
    </div>
  );
};

export default StudentPortal;
