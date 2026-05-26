import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExamById } from '../api/examService';
import { getStudentSubmissions } from '../api/examService';
import { useAuth } from '../context/AuthContext';
import { showError } from '../services/notify';

const StudentPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [examId, setExamId] = useState(''); // מזהה המבחן שהסטודנט רוצה לקחת  
  const [exam, setExam] = useState(null); // פרטי המבחן שנמצא
  const [error, setError] = useState(''); // הודעת שגיאה אם המבחן לא נמצא או שיש בעיה בטעינה
  const [loading, setLoading] = useState(false); // מצב טעינה
  const [pastExams, setPastExams] = useState([]);

  const handleFetchExam = async () => {
    if (!examId) return;
    setLoading(true);
    setError('');
    setExam(null);
    try {
      const data = await getExamById(examId);
      setExam(data);
    } catch (err) {
      const message = err?.message || 'Unable to find exam.';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPast = async () => {
      if (!user?.name) return;
      try {
        const data = await getStudentSubmissions(user.name);
        setPastExams(data || []);
      } catch (err) {
        showError(err?.message || 'Failed to load past exams');
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

          {exam && (
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
          )}
        </div>
      </div>

      <div className="card shadow rounded-4 mt-4">
        <div className="card-header bg-light p-4 rounded-top-4">
          <h5 className="mb-0">My Past Exams</h5>
        </div>
        <div className="card-body px-4 py-3">
          {pastExams.length === 0 ? (
            <p className="text-muted">No past exams found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {pastExams.map((p) => (
                    <tr key={p.examId}>
                      <td>{p.title}</td>
                      <td>{p.score}%</td>
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
