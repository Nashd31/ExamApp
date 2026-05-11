import React, { useState, useEffect } from 'react';
import { getAllExams } from './api/examService';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]); // רשימת המבחנים
  const [loading, setLoading] = useState(true); // מצב טעינה

  // קבלת כל המבחנים מהשרת בעת טעינה
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await getAllExams();
        setExams(data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3>Teacher Dashboard</h3>
        </div>
        <div className="card-body">
          <h5 className="card-title">Manage Exams</h5>
          {loading ? (
            <p>Loading exams...</p>
          ) : (
            <div className="list-group">
              {exams.map((exam) => (
                <div key={exam.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{exam.title}</strong>
                    <br />
                    <small className="text-muted">ID: {exam.id} | {exam.questions.length} Questions</small>
                  </div>
                  <button className="btn btn-sm btn-outline-primary">Edit</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-success mt-3">Create New Exam</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
