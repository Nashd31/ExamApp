import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamById, getExamSubmissions } from '../api/examService';
import { showError } from '../services/notify';

/**
 * ExamScores Component
 * Displays a list of student submissions/scores for a specific exam.
 */
const ExamScores = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScoresData = async () => {
      try {
        const [fetchedExam, fetchedSubmissions] = await Promise.all([
          getExamById(examId),
          getExamSubmissions(examId)
        ]);
        setExam(fetchedExam);
        setSubmissions(fetchedSubmissions);
      } catch (error) {
        showError('Failed to fetch scores data: ' + (error.message || error));
      } finally {
        setLoading(false);
      }
    };

    fetchScoresData();
  }, [examId]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading scores...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Exam not found.</div>
        <button className="btn btn-primary" onClick={() => navigate('/teacher')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow rounded-4">
        <div className="card-header bg-info text-white d-flex justify-content-between align-items-center p-4 rounded-top-4">
          <h3 className="mb-0">Scores for: {exam.title}</h3>
          <button className="btn btn-outline-light px-4" onClick={() => navigate('/teacher')}>Back to Exams</button>
        </div>
        <div className="card-body px-5 py-4">
          {submissions.length === 0 ? (
            <p className="text-muted text-center my-4">No submissions found for this exam.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Student Name</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, idx) => (
                    <tr key={idx}>
                      <td>{sub.studentName}</td>
                      <td>{sub.score}%</td>
                      <td>
                        {sub.score >= (exam.passGrade || 50) ? (
                          <span className="badge bg-success">Passed</span>
                        ) : (
                          <span className="badge bg-danger">Failed</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/grade/${sub.id}`)}
                        >
                          Review & Grade
                        </button>
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

export default ExamScores;
