import { useState } from 'react';
import { adjustExam } from '../api/examService';
import { showSuccess } from '../services/notify';
import CustomDateTimePicker from './CustomDateTimePicker';

/**
 * ExamAdjustment Component
 * A premium, glassmorphic settings panel for adjusting active or finished exams.
 * Mirrors the look and feel of the General Settings card in ExamEditor.
 */
const ExamAdjustment = ({ exam, onSaveSuccess, onCancel }) => {
  const [title, setTitle] = useState(exam?.title || '');
  const [duration, setDuration] = useState(exam?.duration || 60);
  const [passGrade, setPassGrade] = useState(exam?.passGrade || 50);
  const [factor, setFactor] = useState(exam?.factor || 0);
  const [endDate, setEndDate] = useState(exam?.endDate || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Exam title is required.');
      return;
    }
    if (!endDate) {
      setError('End date and time are required.');
      return;
    }

    const start = new Date(exam.startDate);
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      setError('Invalid end date.');
      return;
    }
    if (end <= start) {
      setError('End date must be strictly after the start date.');
      return;
    }
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      setError('Duration must be a positive number greater than 0.');
      return;
    }
    if (passGrade === undefined || passGrade === '' || isNaN(Number(passGrade)) || Number(passGrade) <= 0 || Number(passGrade) > 100) {
      setError('Pass grade must be between 1 and 100.');
      return;
    }

    try {
      setLoading(true);
      const updated = await adjustExam(exam.id, {
        title: title.trim(),
        duration: Number(duration),
        endDate,
        passGrade: Number(passGrade),
        factor: Number(factor)
      });
      showSuccess(`Exam "${updated.title}" adjusted successfully.`);
      onSaveSuccess();
    } catch (err) {
      setError(err?.message || 'Failed to adjust exam settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card portal-glass-card border-0">
      <style>{`
        .editor-header-card {
            background: var(--theme-gradient) !important;
            color: #ffffff;
            box-shadow: 0 10px 25px var(--theme-glow) !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
        }
        .modern-form-control {
            border-radius: 9px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            transition: all 0.3s ease;
            accent-color: var(--theme-color);
        }
        .modern-form-control:focus {
            border-color: var(--theme-color);
            background: #ffffff;
            box-shadow: 0 0 0 3px var(--theme-glow);
        }
        .btn-save-exam {
            background: var(--theme-gradient);
            border: none;
            color: white;
            font-weight: 600;
            box-shadow: 0 4px 12px var(--theme-glow);
            transition: all 0.2s ease;
        }
        .btn-save-exam:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px var(--theme-glow);
            color: #ffffff;
        }
        .btn-save-exam:disabled {
            background: var(--theme-gradient);
            cursor: not-allowed;
            box-shadow: none;
            color: #ffffff;
        }
        .btn-cancel-exam {
            background: rgba(148, 163, 184, 0.06);
            border: 1px solid rgba(148, 163, 184, 0.18);
            color: #475569;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-cancel-exam:hover {
            background: rgba(148, 163, 184, 0.12);
            color: #1e293b;
            transform: translateY(-1px);
        }
        .modern-alert {
            border-radius: 10px;
            border: 1px solid rgba(239, 68, 68, 0.2);
            background-color: #fef2f2;
            color: #b91c1c;
            padding: 10px 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.02);
        }
      `}</style>

      <div className="card-header editor-header-card d-flex justify-content-between align-items-center p-4 border-0 text-start">
        <h4 className="fw-bold mb-0">
          Adjust Exam Settings: <span className="text-warning fw-semibold">{exam?.title}</span>
        </h4>
        <button className="btn btn-outline-light px-4 rounded-3 fw-semibold btn-sm" onClick={onCancel}>
          Back to List
        </button>
      </div>

      <div className="card-body p-4 p-md-5 text-start">
        {/* Adjustment Fields Container */}
        <div className="card border-0 shadow-sm p-4 mb-4 rounded-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <h5 className="fw-bold mb-3" style={{ color: '#1e293b', fontSize: '16px' }}>Adjust Settings</h5>
          
          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary mb-1.5">Exam Title</label>
            <input
              className="form-control form-control-lg modern-form-control"
              style={{ height: '48px', fontSize: '15px' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Computer Science"
            />
          </div>

          <div className="row g-3">
            <div className="col-md-3 col-sm-6">
              <label className="form-label small fw-semibold text-secondary mb-1.5">Duration (mins)</label>
              <input
                type="number"
                min={1}
                className="form-control modern-form-control"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <label className="form-label small fw-semibold text-secondary mb-1.5">Pass Grade (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="form-control modern-form-control"
                value={passGrade}
                onChange={(e) => setPassGrade(Number(e.target.value))}
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <label className="form-label small fw-semibold text-secondary mb-1.5">Grade Factor (points)</label>
              <input
                type="number"
                className="form-control modern-form-control"
                placeholder="e.g. 5, -2"
                value={factor}
                onChange={(e) => setFactor(Number(e.target.value))}
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <CustomDateTimePicker
                label="End Date & Time"
                value={endDate}
                alignRight={true}
                onChange={(val) => setEndDate(val)}
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="modern-alert mb-4">
            <span className="d-flex align-items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </span>
            <button type="button" className="btn-close" style={{ fontSize: '10px' }} onClick={() => setError('')} aria-label="Close"></button>
          </div>
        )}

        {/* Save/Cancel Buttons */}
        <div className="d-flex gap-3 justify-content-end align-items-center mt-4 pt-3 border-top">
          <button
            className="btn btn-save-exam py-2 px-5 rounded-3 btn-sm"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving adjustments...' : 'Save Adjustments'}
          </button>
          <button className="btn btn-cancel-exam py-2 px-4 rounded-3 btn-sm" disabled={loading} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamAdjustment;
