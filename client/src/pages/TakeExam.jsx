import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamById, submitExam } from '../api/examService';
import { showSuccess, showError } from '../services/notify';

const TakeExam = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null); // seconds
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const loadExam = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await getExamById(id);
                setExam(data);
                // initialize timer when exam loaded
                const seconds = (data.duration && Number(data.duration) > 0) ? Number(data.duration) * 60 : 60 * 60;
                setTimeLeft(seconds);
            } catch (err) {
                setError(err?.message || 'Failed to load exam.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadExam();
        }
    }, [id]);

    // countdown interval
    useEffect(() => {
        if (timeLeft === null || submitted) return;
        const tick = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null) return prev;
                if (prev <= 1) {
                    clearInterval(tick);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(tick);
    }, [timeLeft, submitted]);

    // auto-submit when timeLeft reaches zero
    useEffect(() => {
        if (timeLeft === 0 && exam && !submitted) {
            const autoSubmit = async () => {
                try {
                    setSubmitted(true);
                    const score = await submitExam(exam.id, user?.name || 'Student', answers);
                    const passGrade = exam.passGrade || 50;
                    const status = score >= passGrade ? 'Passed' : 'Failed';
                    showSuccess(`Time is up! Exam auto-submitted. Score: ${score}/100. Status: ${status}`);
                    navigate('/student');
                } catch (err) {
                    showError(err?.message || 'Auto-submit failed.');
                    navigate('/student');
                }
            };
            autoSubmit();
        }
    }, [timeLeft, exam, submitted, answers, navigate, user]);

    // Lockdown: warn on unload and prevent some actions while exam is active
    useEffect(() => {
        if (!exam || submitted) return;

        const onBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'Leaving will submit the exam and may forfeit your attempt.';
            return e.returnValue;
        };

        const onContextMenu = (e) => {
            e.preventDefault();
        };

        const onKeyDown = (e) => {
            // block common refresh/close keys
            if (e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 'w' || e.key === 'W'))) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('contextmenu', onContextMenu);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('contextmenu', onContextMenu);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [exam, submitted]);

    // History Trap: Block back button navigation
    useEffect(() => {
        if (!exam || submitted) return;

        // Push initial state to prevent going back past this page
        window.history.pushState(null, null, window.location.href);

        const handlePopState = () => {
            // Push state again to prevent leaving
            window.history.pushState(null, null, window.location.href);
            showError('You cannot leave the exam. Please submit your answers first.');
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [exam, submitted]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!exam) return;

        const confirmed = window.confirm('Are you sure you want to submit your exam?');
        if (!confirmed) return;

        try {
            const score = await submitExam(exam.id, user?.name || 'Student', answers);
            const passGrade = exam.passGrade || 50;
            const status = score >= passGrade ? 'Passed' : 'Failed';
            showSuccess(`Exam submitted successfully! Your score is ${score}/100. Status: ${status}`);
            navigate('/student');
        } catch (err) {
            showError(err?.message || 'Failed to submit exam.');
        }
    };

    const formatTime = (secs) => {
        if (secs == null) return '--:--';
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading exam...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow rounded-4">
                <div className="card-header d-flex justify-content-between align-items-center bg-warning text-dark p-4 rounded-top-4 sticky-top">
                    <div className="mb-1">
                        <h3>Take Exam: {exam?.title}</h3>
                        <p className="mb-0 text-muted">Answered by: {user?.name || 'Student'}</p>
                    </div>
                    <div className={`fs-5 border rounded px-3 py-2 text-white ${timeLeft <= 600 ? 'bg-danger animate-pulse' : 'bg-primary'
                        }`}>
                        <strong>{formatTime(timeLeft)}</strong>
                    </div>
                </div>
                <div className="card-body px-5 py-4">
                    {exam?.questions.map((question, index) => {
                        const questionKey = question.id || index;
                        return (
                            <div key={questionKey} className="mb-4">
                                <h5 className="mb-3">
                                    {index + 1}. {question.text}
                                </h5>
                                {(!question.type || question.type === 'multiple_choice') ? (
                                    question.options?.map((option, optionIndex) => (
                                        <div className="form-check" key={optionIndex}>
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`question-${questionKey}`}
                                                id={`q-${questionKey}-opt-${optionIndex}`}
                                                value={optionIndex}
                                                checked={answers[questionKey] === optionIndex}
                                                onChange={() => handleAnswerChange(questionKey, optionIndex)}
                                            />
                                            <label className="form-check-label" htmlFor={`q-${questionKey}-opt-${optionIndex}`}>
                                                {option}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Type your answer here..."
                                        value={answers[questionKey] || ''}
                                        onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
                                    ></textarea>
                                )}
                            </div>
                        );
                    })}

                    <div className="d-flex justify-content-end align-items-center mt-4">
                        <button className="btn btn-success" onClick={handleSubmit}>
                            Submit Exam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TakeExam;
