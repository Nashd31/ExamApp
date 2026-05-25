import React, { useState, useEffect } from 'react';
import { getAllExams, createExam, updateExam, deleteExam } from '../api/examService';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showError } from '../services/notify';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getAllExams();
      setExams(data);
    } catch (error) {
      showError('Error fetching exams: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleEditClick = (exam) => {
    setEditingExam(JSON.parse(JSON.stringify(exam)));
  };

  const handleTitleChange = (e) => {
    setEditingExam({ ...editingExam, title: e.target.value });
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex][field] = value;
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex].options.push('New Option');
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = [...editingExam.questions];
    if (updatedQuestions[qIndex].options.length > 2) {
      updatedQuestions[qIndex].options.splice(oIndex, 1);
      if (updatedQuestions[qIndex].answer === oIndex) {
        updatedQuestions[qIndex].answer = 0;
      } else if (updatedQuestions[qIndex].answer > oIndex) {
        updatedQuestions[qIndex].answer -= 1;
      }
      setEditingExam({ ...editingExam, questions: updatedQuestions });
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      text: 'New Question',
      options: ['Option 1', 'Option 2'],
      answer: 0
    };
    setEditingExam({
      ...editingExam,
      questions: [...editingExam.questions, newQuestion]
    });
  };

  const handleRemoveQuestion = (qIndex) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions.splice(qIndex, 1);
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  const handleCreateClick = () => {
    setEditingExam({
      title: 'New Exam',
      questions: [
        {
          id: `q${Date.now()}`,
          text: 'New Question',
          options: ['Option 1', 'Option 2'],
          answer: 0
        }
      ],
      isNew: true
    });
  };

  const handleDeleteClick = async (examId) => {
    const confirmed = window.confirm('Are you sure you want to delete this exam?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteExam(examId);
      setExams(exams.filter(exam => exam.id !== examId));
    } catch (error) {
      showError('Failed to delete exam: ' + (error.message || error));
    }
  };

  const handleSave = async () => {
    try {
      let savedExam;
      if (editingExam.isNew || !editingExam.id) {
        const { isNew, ...newExamData } = editingExam;
        savedExam = await createExam(newExamData);
        setExams([...exams, savedExam]);
      } else {
        savedExam = await updateExam(editingExam);
        setExams(exams.map(exam =>
          exam.id === savedExam.id ? savedExam : exam
        ));
      }

      setEditingExam(null);
      showSuccess('Exam saved successfully.');
    } catch (error) {
      showError('Failed to save: ' + (error.message || error));
    }
  };

  if (editingExam) {
    return (
      <div className="container mt-4 mb-5">
        <div className="card shadow">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h3>{editingExam.isNew ? 'Creating New Exam:' : 'Editing Exam:'} {editingExam.title}</h3>
            <button className="btn btn-light btn-sm" onClick={() => setEditingExam(null)}>Back to List</button>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <label className="form-label fw-bold">Exam Title</label>
              <input
                className="form-control form-control-lg"
                value={editingExam.title}
                onChange={handleTitleChange}
              />
            </div>

            <h5 className="border-bottom pb-2 mb-3">Questions</h5>
            {editingExam.questions.map((q, qIndex) => (
              <div key={q.id} className="card mb-4 border-secondary">
                <div className="card-body bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Question {qIndex + 1}</h6>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveQuestion(qIndex)}>Remove Question</button>
                  </div>
                  <input
                    className="form-control mb-3"
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    placeholder="Enter question text"
                  />

                  <div className="ms-3">
                    <label className="form-label small text-muted">Options (Select the correct one):</label>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="input-group mb-2">
                        <div className="input-group-text">
                          <input
                            type="radio"
                            name={`q${qIndex}`}
                            className="form-check-input mt-0"
                            checked={q.answer === oIndex}
                            onChange={() => handleQuestionChange(qIndex, 'answer', oIndex)}
                          />
                        </div>
                        <input
                          className="form-control"
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          disabled={q.options.length <= 2}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => handleAddOption(qIndex)}>
                      + Add Option
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
              <button className="btn btn-outline-primary me-md-2" onClick={handleAddQuestion}>Add New Question</button>
              <button className="btn btn-success px-5" onClick={handleSave}>
                {editingExam?.isNew ? 'Create Exam' : 'Save Changes'}
              </button>
              <button className="btn btn-secondary px-4" onClick={() => setEditingExam(null)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3>Teacher Dashboard</h3>
        </div>
        <div className="card-body">
          <h5 className="card-title mb-1">Manage Exams</h5>
          <p className="text-muted mb-4">Welcome back, {user?.name || 'Teacher'}. Use this dashboard to create, edit, and delete exams.</p>
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading exams...</p>
            </div>
          ) : (
            <div className="list-group">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h6 className="mb-1">{exam.title}</h6>
                    <small className="text-muted">ID: {exam.id} | {exam.questions.length} Questions</small>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEditClick(exam)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteClick(exam.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <button className="btn btn-success" onClick={handleCreateClick}>Create New Exam</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
