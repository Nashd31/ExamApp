import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllExams, createExam, updateExam, deleteExam, getExamSubmissions } from '../api/examService';
import { useAuth } from '../hooks/useAuth';
import { showSuccess, showError } from '../services/notify';
import { getExamStatus, toDatetimeLocal, formatDate } from '../utils/examUtils';

/**
 * TeacherDashboard Component
 * Provides a comprehensive interface for teachers to manage exams.
 * Capabilities include creating, editing, publishing, deleting exams, and viewing student submissions/scores.
 */
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState(null);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [error, setError] = useState('');
  // Fetches all exams from the server and updates local state.
  const fetchExams = async () => {
    try {
      const data = await getAllExams();
      setExams(data);

      // Fetch submission counts for each exam
      const counts = {};
      for (const exam of data) {
        try {
          const subs = await getExamSubmissions(exam.id);
          counts[exam.id] = subs.length;
        } catch {
          counts[exam.id] = 0;
        }
      }
      setSubmissionCounts(counts);
    } catch (error) {
      showError('Error fetching exams: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // Initial load of all exams when the component mounts
  useEffect(() => {
    const init = async () => {
      await fetchExams();
    };
    init();
  }, []);



  // Prepares an exam for editing by creating a deep copy to avoid mutating the original state directly.
  const handleEditClick = (exam) => {
    setError('');
    setEditingExam(JSON.parse(JSON.stringify(exam)));
  };

  const handleTogglePublishGrades = async (exam) => {
    // Validate: exam must be completed and have submissions
    const status = getExamStatus(exam);
    if (status !== 'Done') {
      showError('Grades can only be published once the exam has acomplished.');
      return;
    }
    if (submissionCounts[exam.id] === 0) {
      showError('Cannot publish grades - no student submissions yet.');
      return;
    }

    try {
      setLoading(true);
      const updated = { ...exam, areGradesPublished: !exam.areGradesPublished };
      await updateExam(updated);
      showSuccess(`Grades ${updated.areGradesPublished ? 'published' : 'unpublished'} successfully.`);
      fetchExams();
    } catch (error) {
      showError('Failed to toggle grades publish status: ' + (error.message || error));
      setLoading(false);
    }
  };




  // Updates the title of the exam currently being edited.
  const handleTitleChange = (e) => {
    setEditingExam({ ...editingExam, title: e.target.value });
  };

  // Updates a specific field (text, type, answer, etc.) of a question within the exam currently being edited.
  const handleQuestionChange = (qIndex, field, value) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex][field] = value;
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  // Updates the text of a specific option within a multiple-choice question.

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };


  // Appends a new blank option to a multiple-choice question.
  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions[qIndex].options.push('New Option');
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  /**
   * Removes a specific option from a multiple-choice question.
   * Adjusts the correct answer index if the removed option shifts the indexes.
   */
  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = [...editingExam.questions];
    if (updatedQuestions[qIndex].options.length > 2) {
      updatedQuestions[qIndex].options.splice(oIndex, 1);
      // Adjust the selected correct answers to ensure validity
      const oldAnswers = updatedQuestions[qIndex].correctAnswers || [];
      const newAnswers = oldAnswers
        .filter(ans => ans !== oIndex)
        .map(ans => ans > oIndex ? ans - 1 : ans);
      updatedQuestions[qIndex].correctAnswers = newAnswers.length > 0 ? newAnswers : [0];
      setEditingExam({ ...editingExam, questions: updatedQuestions });
    }
  };


  // Appends a new default multiple-choice question to the current exam.
  const handleAddQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      text: 'New Question',
      type: 'multiple_choice',
      allowMultipleAnswers: false,
      options: ['Option 1', 'Option 2'],
      correctAnswers: [0],
      points: 10
    };

    setEditingExam({
      ...editingExam,
      questions: [...editingExam.questions, newQuestion]
    });
  };

  // Removes a specific question from the current exam.
  const handleRemoveQuestion = (qIndex) => {
    const updatedQuestions = [...editingExam.questions];
    updatedQuestions.splice(qIndex, 1);
    setEditingExam({ ...editingExam, questions: updatedQuestions });
  };

  // Initializes a new, empty exam template and sets it as the active editing exam.
  const handleCreateClick = () => {
    setError('');
    setEditingExam({
      title: 'New Exam',
      duration: 60,
      passGrade: 50,
      startDate: '',
      endDate: '',
      areGradesPublished: false,
      questions: [
        {
          id: `q${Date.now()}`,
          type: 'multiple_choice',
          text: 'New Question',
          allowMultipleAnswers: false,
          options: ['Option 1', 'Option 2'],
          correctAnswers: [0],
          points: 10
        }
      ],
      isNew: true
    });
  };

  // Prompts for confirmation and deletes the specified exam if confirmed.
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


  // Persists the currently edited exam (either creating a new one or updating an existing one).
  const handleSave = async () => {
    setError('');
    if (!editingExam.startDate || !editingExam.endDate) {
      setError('Start date and End date are required.');
      return;
    }

    const start = new Date(editingExam.startDate);
    const end = new Date(editingExam.endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Invalid start or end date.');
      return;
    }

    if (end <= start) {
      setError('End date must be strictly after the start date.');
      return;
    }

    // Start time cannot be in the past (with a 1-minute grace buffer for completion lag)
    if (start.getTime() < now.getTime() - 60000) {
      setError('Start time cannot be before the current time.');
      return;
    }

    // Check if trying to edit an active or completed exam (except when creating)
    if (!editingExam.isNew && editingExam.id) {
      const originalExam = exams.find(e => e.id === editingExam.id);
      if (originalExam) {
        const origStatus = getExamStatus(originalExam);
        if (origStatus === 'Published' || origStatus === 'Done') {
          setError('Cannot edit an exam that is currently active or completed.');
          return;
        }
      }
    }

    try {
      let savedExam;
      if (editingExam.isNew || !editingExam.id) {
        const newExamData = { ...editingExam };
        delete newExamData.isNew;
        savedExam = await createExam(newExamData);
        setExams([...exams, savedExam]);
      } else {
        savedExam = await updateExam(editingExam);
        setExams(exams.map(exam =>
          exam.id === savedExam.id ? savedExam : exam
        ));
      }

      setEditingExam(null);
      setError('');
      showSuccess('Exam: "' + savedExam.title + '" saved successfully.');
    } catch (err) {
      setError('Failed to save: ' + (err.message || err));
    }
  };



  // Render view: Creating or editing an exam
  if (editingExam) {
    return (
      <div className="container mt-4 mb-5">
        <div className="card shadow rounded-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center p-4 rounded-top-4">
            <h3>{editingExam.isNew ? 'Creating New Exam:' : 'Editing Exam:'} {editingExam.title}</h3>
            <button className="btn btn-outline-light px-4" onClick={() => { setEditingExam(null); setError(''); }}>Back to List</button>
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
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-sm-6">
                <label className="form-label mb-2">Duration (mins)</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={editingExam.duration || 60}
                  onChange={(e) => setEditingExam({ ...editingExam, duration: Number(e.target.value) })}
                />
              </div>
              <div className="col-md-3 col-sm-6">
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
              <div className="col-md-3 col-sm-6">
                <label className="form-label mb-2">Start Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={toDatetimeLocal(editingExam.startDate)}
                  onChange={(e) => setEditingExam({
                    ...editingExam,
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                  })}
                />
              </div>
              <div className="col-md-3 col-sm-6">
                <label className="form-label mb-2">End Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={toDatetimeLocal(editingExam.endDate)}
                  onChange={(e) => setEditingExam({
                    ...editingExam,
                    endDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                  })}
                />
              </div>
            </div>

            {(() => {
              const totalPoints = editingExam.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
              const pointsStatus = totalPoints === 100 ? 'success' : 'danger';
              const pointsMessage = totalPoints === 100
                ? 'Total points: 100 ✓'
                : totalPoints > 100
                  ? `Total points: ${totalPoints} (${totalPoints - 100} points over limit)`
                  : `Total points: ${totalPoints} (${100 - totalPoints} points remaining)`;

              return (
                <div className={`alert alert-${pointsStatus} mb-4`}>
                  <strong>{pointsMessage}</strong>
                </div>
              );
            })()}

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
                        const newType = e.target.value;
                        handleQuestionChange(qIndex, 'type', newType);
                        if (newType === 'multiple_choice') {
                          if (!q.options) {
                            handleQuestionChange(qIndex, 'options', ['Option 1', 'Option 2']);
                          }
                          handleQuestionChange(qIndex, 'correctAnswers', q.correctAnswers || [0]);
                          handleQuestionChange(qIndex, 'allowMultipleAnswers', q.allowMultipleAnswers || false);
                        }
                      }}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="open_ended">Open Ended</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      className="form-control w-auto"
                      style={{ maxWidth: '120px' }}
                      placeholder="Points"
                      value={q.points || 0}
                      onChange={(e) => handleQuestionChange(qIndex, 'points', Number(e.target.value))}
                    />
                  </div>

                  <div className="ms-3">
                    {(!q.type || q.type === 'multiple_choice') ? (
                      <>
                        <div className="form-check form-switch mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`multi-answer-toggle-${q.id}`}
                            checked={q.allowMultipleAnswers || false}
                            onChange={(e) => {
                              const allowMulti = e.target.checked;
                              const currentAnswers = q.correctAnswers || [];
                              const newAnswers = allowMulti
                                ? currentAnswers.length > 0 ? currentAnswers : [0]
                                : currentAnswers.length > 0 ? [currentAnswers[0]] : [0];
                              handleQuestionChange(qIndex, 'allowMultipleAnswers', allowMulti);
                              handleQuestionChange(qIndex, 'correctAnswers', newAnswers);
                            }}
                          />
                          <label className="form-check-label" htmlFor={`multi-answer-toggle-${q.id}`}>
                            Allow multiple correct answers
                          </label>
                        </div>
                        <label className="form-label small text-muted">
                          Options (Select the correct {q.allowMultipleAnswers ? 'answers' : 'answer'}):
                        </label>
                        {q.options?.map((opt, oIndex) => (
                          <div key={oIndex} className="input-group mb-2">
                            <div className="input-group-text">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={(q.correctAnswers || []).includes(oIndex)}
                                onChange={(e) => {
                                  const currentAnswers = q.correctAnswers || [];
                                  let newAnswers;
                                  if (q.allowMultipleAnswers) {
                                    if (e.target.checked) {
                                      newAnswers = [...currentAnswers, oIndex];
                                    } else {
                                      newAnswers = currentAnswers.filter(a => a !== oIndex);
                                    }
                                  } else {
                                    newAnswers = e.target.checked ? [oIndex] : [];
                                  }
                                  handleQuestionChange(qIndex, 'correctAnswers', newAnswers);
                                }}
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
            {error && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
              </div>
            )}
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
              <button className="btn btn-outline-primary me-md-2" onClick={handleAddQuestion}>Add New Question</button>
              {(() => {
                const totalPoints = editingExam.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
                return (
                  <button
                    className="btn btn-success px-5"
                    onClick={handleSave}
                    disabled={totalPoints !== 100}
                  >
                    {editingExam?.isNew ? 'Create Exam' : 'Save Changes'}
                  </button>
                );
              })()}
              <button className="btn btn-secondary px-4" onClick={() => { setEditingExam(null); setError(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render view: Default main dashboard listing all exams
  return (
    <div className="container mt-4 mb-5" >
      <div className="card shadow rounded-4">
        <div className="card-header bg-primary text-white p-4 rounded-top-4">
          <h3>Teacher Dashboard</h3>
        </div>
        <div className="card-body px-5 py-4">
          <h5 className="card-title mb-1">Manage Exams</h5>
          <p className="text-muted mb-4">Welcome back, <strong>{user?.name || 'Teacher'}</strong>. Use this dashboard to manage exams, review student submissions, and publish grades.</p>
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
                      {(() => {
                        const status = getExamStatus(exam);
                        if (status === 'Published') {
                          return <span className="badge bg-success">Published</span>;
                        } else if (status === 'Scheduled') {
                          return <span className="badge bg-warning text-dark">Scheduled</span>;
                        } else if (status === 'Done') {
                          return <span className="badge bg-secondary">Done</span>;
                        } else {
                          return <span className="badge bg-dark">Draft</span>;
                        }
                      })()}
                    </h6>
                    <small className="text-muted">
                      ID: {exam.id} | {exam.questions.length} Questions | {exam.duration || 60} mins
                      {exam.startDate && ` | Start: ${formatDate(exam.startDate)}`}
                      {exam.endDate && ` | End: ${formatDate(exam.endDate)}`}
                    </small>
                  </div>
                  <div className="d-flex gap-3 flex-wrap">
                    {getExamStatus(exam) === 'Done' && (
                      <button
                        className={`btn btn-sm ${submissionCounts[exam.id] === 0 ? 'btn-secondary disabled' : exam.areGradesPublished ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => handleTogglePublishGrades(exam)}
                        disabled={submissionCounts[exam.id] === 0}
                        title={submissionCounts[exam.id] === 0 ? 'No student submissions yet' : exam.areGradesPublished ? 'Click to unpublish grades' : 'Click to publish grades'}
                      >
                        {exam.areGradesPublished ? 'Unpublish Grades' : 'Publish Grades'}
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => navigate(`/teacher/exam/${exam.id}/scores`)}
                    >
                      View Scores
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEditClick(exam)}
                      disabled={getExamStatus(exam) === 'Published' || getExamStatus(exam) === 'Done'}
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
