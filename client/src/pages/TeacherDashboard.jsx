import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllExams, createExam, updateExam, deleteExam, getExamSubmissions } from '../api/examService';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showError } from '../services/notify';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState(null);
  const [viewingScoresFor, setViewingScoresFor] = useState(null);
  const [examSubmissions, setExamSubmissions] = useState([]);

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

  useEffect(() => {
    if (exams.length > 0 && location.state?.returnToScoresFor) {
      const examId = location.state.returnToScoresFor;
      const exam = exams.find(e => e.id === examId);
      if (exam) {
        handleViewScores(exam);
      }
      navigate('/teacher', { replace: true, state: {} });
    }
  }, [exams, location.state, navigate]);

  const handleEditClick = (exam) => {
    setEditingExam(JSON.parse(JSON.stringify(exam)));
  };

  const handleTogglePublish = async (exam) => {
    try {
      const updated = { ...exam, isPublished: !exam.isPublished };
      await updateExam(updated);
      showSuccess(`Exam ${updated.isPublished ? 'published' : 'unpublished'} successfully.`);
      fetchExams();
    } catch (error) {
      showError('Failed to toggle publish status: ' + (error.message || error));
    }
  };

  const handleViewScores = async (exam) => {
    setViewingScoresFor(exam);
    try {
      const subs = await getExamSubmissions(exam.id);
      setExamSubmissions(subs);
    } catch (error) {
      showError('Failed to fetch scores: ' + (error.message || error));
    }
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
      type: 'multiple_choice',
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
      duration: 60,
      passGrade: 50,
      isPublished: false,
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

  if (viewingScoresFor) {
    return (
      <div className="container mt-4 mb-5">
        <div className="card shadow rounded-4">
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center p-4 rounded-top-4">
            <h3>Scores for: {viewingScoresFor.title}</h3>
            <button className="btn btn-outline-light px-4" onClick={() => setViewingScoresFor(null)}>Back to Exams</button>
          </div>
          <div className="card-body px-5 py-4">
            {examSubmissions.length === 0 ? (
              <p className="text-muted text-center">No submissions found for this exam.</p>
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
                    {examSubmissions.map((sub, idx) => (
                      <tr key={idx}>
                        <td>{sub.studentName}</td>
                        <td>{sub.score}%</td>
                        <td>
                          {sub.score >= (viewingScoresFor.passGrade || 50) ? (
                            <span className="badge bg-success">Passed</span>
                          ) : (
                            <span className="badge bg-danger">Failed</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/teacher/review-exam/${viewingScoresFor.id}/${sub.studentName}`)}
                          >
                            Review
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
  }

  if (editingExam) {
    return (
      <div className="container mt-4 mb-5">
        <div className="card shadow rounded-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center p-4 rounded-top-4">
            <h3>{editingExam.isNew ? 'Creating New Exam:' : 'Editing Exam:'} {editingExam.title}</h3>
            <button className="btn btn-outline-light px-4" onClick={() => setEditingExam(null)}>Back to List</button>
          </div>
          <div className="card-body px-5 py-4">
            <div className="mb-4">
              <h5 className="form-label mb-2">Exam Title</h5>
              <input
                className="form-control form-control-lg"
                value={editingExam.title}
                onChange={handleTitleChange}
              />
            </div>
            <div className="mb-4 row">
              <div className="col-md-6">
                <label className="form-label mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={editingExam.duration || 60}
                  onChange={(e) => setEditingExam({ ...editingExam, duration: Number(e.target.value) })}
                />
              </div>
              <div className="col-md-6 mt-3 mt-md-0">
                <label className="form-label mb-2">Pass Grade (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="form-control"
                  value={editingExam.passGrade || 50}
                  onChange={(e) => setEditingExam({ ...editingExam, passGrade: Number(e.target.value) })}
                />
              </div>
            </div>

            <h5 className="border-bottom pb-2 mb-3">Questions</h5>
            {editingExam.questions.map((q, qIndex) => (
              <div key={q.id} className="card mb-4 border-secondary rounded-4">
                <div className="card-body bg-light rounded-4 p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Question {qIndex + 1}</h6>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveQuestion(qIndex)}>Remove Question</button>
                  </div>
                  <div className="d-flex gap-3 mb-3">
                    <input
                      className="form-control"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                      placeholder="Enter question text"
                    />
                    <select
                      className="form-select w-auto"
                      value={q.type || 'multiple_choice'}
                      onChange={(e) => {
                        handleQuestionChange(qIndex, 'type', e.target.value);
                        if (e.target.value === 'multiple_choice' && !q.options) {
                          handleQuestionChange(qIndex, 'options', ['Option 1', 'Option 2']);
                          handleQuestionChange(qIndex, 'answer', 0);
                        }
                      }}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="open_ended">Open Ended</option>
                    </select>
                  </div>

                  <div className="ms-3">
                    {(!q.type || q.type === 'multiple_choice') ? (
                      <>
                        <label className="form-label small text-muted">Options (Select the correct one):</label>
                        {q.options?.map((opt, oIndex) => (
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
                      </>
                    ) : (
                      <textarea
                        className="form-control mt-2"
                        disabled
                        value="Student will write their answer here."
                      />
                    )}
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
    <div className="container mt-4 mb-5" >
      <div className="card shadow rounded-4">
        <div className="card-header bg-primary text-white p-4 rounded-top-4">
          <h3>Teacher Dashboard</h3>
        </div>
        <div className="card-body px-5 py-4">
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
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center flex-wrap gap-2"
                >
                  <div>
                    <h6 className="mb-1 d-flex align-items-center gap-2">
                      {exam.title}
                      {exam.isPublished ? (
                        <span className="badge bg-success">Published</span>
                      ) : (
                        <span className="badge bg-secondary">Draft</span>
                      )}
                    </h6>
                    <small className="text-muted">ID: {exam.id} | {exam.questions.length} Questions | {exam.duration || 60} mins</small>
                  </div>
                  <div className="d-flex gap-3 flex-wrap">
                    <button
                      className={`btn btn-sm ${exam.isPublished ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => handleTogglePublish(exam)}
                    >
                      {exam.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => handleViewScores(exam)}
                    >
                      View Scores
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEditClick(exam)}
                      disabled={exam.isPublished}
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
