import React, { useState } from 'react';
import { getExamById } from '../api/examService';
import { useAuth } from '../context/AuthContext';
import { showError } from '../services/notify';

const StudentPortal = () => {
  const { user } = useAuth();
  const [examId, setExamId] = useState(''); // מזהה המבחן שהסטודנט רוצה לקחת  
  const [exam, setExam] = useState(null); // פרטי המבחן שנמצא
  const [error, setError] = useState(''); // הודעת שגיאה אם המבחן לא נמצא או שיש בעיה בטעינה
  const [loading, setLoading] = useState(false); // מצב טעינה

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

  return (
    <div className="container mt-4">
      <div className="card shadow border-info">
        <div className="card-header bg-info text-white">
          <h3>Student Portal</h3>
        </div>
        <div className="card-body">
          <h5 className="card-title">Welcome, {user?.name || 'Student'}</h5>
          <p className="text-muted mb-3">Enter the Exam ID provided by your teacher to begin.</p>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Exam ID to Start"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleFetchExam}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Start Exam'}
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {exam && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h6>Loaded Exam: <span className="text-primary">{exam.title}</span></h6>
              <p>Questions available: {exam.questions.length}</p>
              <button className="btn btn-warning w-100">Begin Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
