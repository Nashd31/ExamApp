import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getExamById, submitExam } from '../api/examService';
import { showSuccess, showError } from '../services/notify';
import { useDialog } from '../hooks/useDialog';

/**
 * Renders the interface for taking an exam.
 * Manages the countdown timer, student answers, and automatic/manual submission.
 * Includes lockdown features to prevent navigation or refreshing during the exam.
 */
const TakeExam = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showConfirm } = useDialog();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null); // seconds
    const [submitted, setSubmitted] = useState(false);


    const cleanExamSession = useCallback(() => {
        localStorage.removeItem(`examAnswers_${id}`);
        localStorage.removeItem(`examEndTime_${id}`);
    }, [id]);

    // Fetches the exam data and initializes the countdown timer.
    useEffect(() => {
        const loadExam = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await getExamById(id);
                if (data.startDate && data.endDate) {
                    const start = new Date(data.startDate);
                    const end = new Date(data.endDate);
                    const now = new Date();

                    if (now < start) {
                        setError('This exam is not available yet.');
                        return;
                    }
                    if (now > end) {
                        setError('This exam is not available.');
                        return;
                    }
                }
                setExam(data);

                // Restore saved answers if they exist
                const savedAnswers = localStorage.getItem(`examAnswers_${id}`);
                if (savedAnswers) {
                    setAnswers(JSON.parse(savedAnswers));
                }

                // Restore or calculate timer
                const savedEndTime = localStorage.getItem(`examEndTime_${id}`);
                let seconds;
                if (savedEndTime) {
                    const remainingMs = Number(savedEndTime) - Date.now();
                    seconds = Math.max(0, Math.floor(remainingMs / 1000));
                } else {
                    const durationSeconds = (data.duration && Number(data.duration) > 0) ? Number(data.duration) * 60 : 60 * 60;
                    const endTime = Date.now() + durationSeconds * 1000;
                    localStorage.setItem(`examEndTime_${id}`, endTime.toString());
                    seconds = durationSeconds;
                }
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

    // Manages the countdown timer, decrementing it every second.
    useEffect(() => {
        if (timeLeft === null || submitted || !exam) return;
        const tick = setInterval(() => {
            // Check if current time has exceeded the exam's scheduled end date
            if (exam.endDate && new Date() > new Date(exam.endDate)) {
                clearInterval(tick);
                setTimeLeft(0);
                return;
            }

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
    }, [timeLeft, submitted, exam]);


    // Automatically submits the exam when the countdown timer reaches zero.
    useEffect(() => {
        if (timeLeft === 0 && exam && !submitted) {
            const autoSubmit = async () => {
                try {
                    setSubmitted(true);
                    await submitExam(exam.id, user?.name || 'Student', answers, user?.id);
                    cleanExamSession();
                    showSuccess('Time is up! Exam auto-submitted. Results will be available after your teacher publishes grades.');
                    navigate('/student');
                } catch (err) {
                    cleanExamSession();
                    showError(err?.message || 'Auto-submit failed.');
                    navigate('/student');
                }
            };
            autoSubmit();
        }
    }, [timeLeft, exam, submitted, answers, navigate, user, cleanExamSession]);

    /**
     * Implements basic browser lockdown features:
     * - Warns on page unload (refresh/close).
     * - Disables right-click context menu.
     * - Blocks common refresh shortcuts (F5, Ctrl+R).
     */
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
            // block common refresh/close keys (F5, Ctrl+R, Cmd+R, etc.)
            if (
                e.key === 'F5' || 
                ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) || 
                (e.ctrlKey && (e.key === 'w' || e.key === 'W'))
            ) {
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


    // Prevents the user from using the browser's back button during the exam.
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

    // Updates the local state when the student changes an answer.
    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => {
            const nextAnswers = {
                ...prev,
                [questionId]: value,
            };
            localStorage.setItem(`examAnswers_${id}`, JSON.stringify(nextAnswers));
            return nextAnswers;
        });
    };


    // Submits the exam answers manually upon user confirmation.
    const handleSubmit = async () => {
        if (!exam) return;

        const confirmed = await showConfirm(
            'Submit your exam?',
            'Once submitted you cannot change your answers.'
        );
        if (!confirmed) return;

        try {
            await submitExam(exam.id, user?.name || 'Student', answers, user?.id);
            cleanExamSession();
            showSuccess('Exam submitted successfully! Your results will be available after the teacher publishes the grades.');
            navigate('/student');
        } catch (err) {
            showError(err?.message || 'Failed to submit exam.');
        }
    };


    // Formats the remaining seconds into a MM:SS string format.
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
                                    <span className="badge bg-secondary ms-2">{question.points || 0} Points</span>
                                </h5>
                                {(!question.type || question.type === 'multiple_choice') ? (
                                    <>
                                        <p className="small text-muted mb-2">
                                            {question.allowMultipleAnswers ? 'Multiple answers question.' : 'Single answer question.'}
                                        </p>
                                        {question.options?.map((option, optionIndex) => {
                                            const selectedAnswers = answers[questionKey] || [];
                                            const isChecked = selectedAnswers.includes(optionIndex);
                                            const isMulti = question.allowMultipleAnswers;
                                            return (
                                                <div className="form-check" key={optionIndex}>
                                                    <input
                                                        className="form-check-input"
                                                        type={isMulti ? 'checkbox' : 'radio'}
                                                        name={`question-${questionKey}`}
                                                        id={`q-${questionKey}-opt-${optionIndex}`}
                                                        value={optionIndex}
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const currentAnswers = answers[questionKey] || [];
                                                            let newAnswers;
                                                            if (isMulti) {
                                                                if (e.target.checked) {
                                                                    newAnswers = [...currentAnswers, optionIndex];
                                                                } else {
                                                                    newAnswers = currentAnswers.filter(a => a !== optionIndex);
                                                                }
                                                            } else {
                                                                newAnswers = [optionIndex];
                                                            }
                                                            handleAnswerChange(questionKey, newAnswers);
                                                        }}
                                                    />
                                                    <label className="form-check-label" htmlFor={`q-${questionKey}-opt-${optionIndex}`}>
                                                        {option}
                                                    </label>
                                                </div>
                                            )
                                        })}
                                    </>
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
