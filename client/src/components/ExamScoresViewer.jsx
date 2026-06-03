import { useState, useEffect } from 'react';
import { getExamById, getExamSubmissions } from '../api/examService';
import { showError } from '../services/notify';
import { formatDate } from '../utils/examUtils';

/**
 * ExamLineChart Component
 * Draws a clean SVG Line Chart of student scores with interactive tooltips and threshold markers.
 */
const ExamLineChart = ({ submissions, passGrade }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const width = 600;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yGridLines = [0, 25, 50, 75, 100];

  // Sort submissions descending (highest first on the left, lowest on the right)
  const sortedSubmissions = [...submissions].sort((a, b) => b.score - a.score);

  // Map submissions to SVG coordinate points
  const points = sortedSubmissions.map((sub, i) => {
    const x = paddingLeft + (sortedSubmissions.length > 1 ? (i / (sortedSubmissions.length - 1)) * chartWidth : chartWidth / 2);
    const y = paddingTop + chartHeight - (sub.score / 100) * chartHeight;
    return { x, y, score: sub.score, name: sub.studentName };
  });

  let linePathStr = '';
  let areaPathStr = '';
  if (points.length > 0) {
    if (points.length === 1) {
      linePathStr = `M ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y}`;
      areaPathStr = `M ${points[0].x - 15} ${paddingTop + chartHeight} L ${points[0].x - 15} ${points[0].y} L ${points[0].x + 15} ${points[0].y} L ${points[0].x + 15} ${paddingTop + chartHeight} Z`;
    } else {
      linePathStr = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaPathStr = `${linePathStr} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
      <defs>
        {/* Glowing stroke gradient */}
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--theme-color)" />
          <stop offset="100%" stopColor="var(--theme-color)" stopOpacity="0.5" />
        </linearGradient>
        {/* Shaded area gradient */}
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--theme-color)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--theme-color)" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Y Axis Gridlines */}
      {yGridLines.map((val) => {
        const y = paddingTop + chartHeight - (val / 100) * chartHeight;
        return (
          <g key={val}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 8}
              y={y + 4}
              fill="#64748b"
              fontSize="10"
              textAnchor="end"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Passing Line Indicator */}
      {passGrade > 0 && passGrade < 100 && (() => {
        const y = paddingTop + chartHeight - (passGrade / 100) * chartHeight;
        return (
          <g>
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              strokeOpacity="0.75"
            />
            <text
              x={width - paddingRight - 5}
              y={y - 4}
              fill="#f59e0b"
              fontSize="9"
              fontWeight="bold"
              textAnchor="end"
            >
              Pass limit ({passGrade}%)
            </text>
          </g>
        );
      })()}

      {/* Shaded area */}
      {areaPathStr && (
        <path d={areaPathStr} fill="url(#areaGradient)" />
      )}

      {/* Stroke Line */}
      {linePathStr && (
        <path
          d={linePathStr}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Interactive Dots */}
      {points.map((p, idx) => {
        const isPassed = p.score >= passGrade;
        const isHovered = hoveredIndex === idx;
        return (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="12"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={isHovered ? "7" : "5"}
              fill={isHovered ? (isPassed ? "var(--theme-color)" : "#ef4444") : "#ffffff"}
              stroke={isPassed ? "var(--theme-color)" : "#ef4444"}
              strokeWidth="3"
              style={{ transition: 'all 0.15s ease-in-out', pointerEvents: 'none' }}
            />
          </g>
        );
      })}

      {/* Custom Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (() => {
        const p = points[hoveredIndex];
        const tooltipWidth = 140;
        const tooltipHeight = 45;
        let tx = p.x;
        if (tx - tooltipWidth / 2 < paddingLeft) tx = paddingLeft + tooltipWidth / 2;
        if (tx + tooltipWidth / 2 > width - paddingRight) tx = width - paddingRight - tooltipWidth / 2;
        const ty = p.y - tooltipHeight - 10;

        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={tx - tooltipWidth / 2}
              y={ty}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="6"
              fill="rgba(30, 41, 59, 0.95)"
              stroke="#475569"
              strokeWidth="1"
              filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
            />
            <text
              x={tx}
              y={ty + 18}
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              {p.name}
            </text>
            <text
              x={tx}
              y={ty + 32}
              fill={p.score >= passGrade ? "#34d399" : "#f87171"}
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              Score: {p.score}% ({p.score >= passGrade ? "Passed" : "Failed"})
            </text>
          </g>
        );
      })()}

      {/* X Axis Labels */}
      {submissions.length <= 15 && points.map((p, idx) => (
        <text
          key={idx}
          x={p.x}
          y={height - paddingBottom + 16}
          fill="#64748b"
          fontSize="8px"
          textAnchor="middle"
          transform={`rotate(-15, ${p.x}, ${height - paddingBottom + 16})`}
        >
          {p.name.length > 8 ? p.name.slice(0, 7) + '..' : p.name}
        </text>
      ))}
    </svg>
  );
};

/**
 * ExamDonutChart Component
 * Draws an SVG Donut Chart of Pass/Fail ratios with custom legends and labels.
 */
const ExamDonutChart = ({ passPercent, failPercent, passCount, failCount, highestScore, lowestScore, passGrade }) => {
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~282.74

  const passDash = (passPercent / 100) * circumference;
  const failDash = circumference - passDash;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center w-100">
      <div className="position-relative" style={{ width: '100px', height: '100px' }}>
        <svg width="100" height="100" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Base Background Circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Pass Circle Segment */}
          {passPercent > 0 && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="var(--theme-color)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${passDash} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          )}
          {/* Fail Circle Segment */}
          {failPercent > 0 && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              strokeDasharray={`${failDash} ${circumference}`}
              strokeDashoffset={-passDash}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          )}
        </svg>
        <div className="position-absolute start-50 top-50 translate-middle text-center">
          <div className="fs-5 fw-bold text-dark">{passPercent}%</div>
          <div className="text-muted fw-bold" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Pass</div>
        </div>
      </div>

      <div className="mt-3 w-100 px-3">
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-warning" style={{ width: '8px', height: '8px' }}></span>
            Passing Grade
          </span>
          <span className="fw-bold text-warning">{passGrade}%</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></span>
            Passed
          </span>
          <span className="fw-bold text-success">{passPercent}% ({passCount})</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-danger" style={{ width: '8px', height: '8px' }}></span>
            Failed
          </span>
          <span className="fw-bold text-danger">{failPercent}% ({failCount})</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-info" style={{ width: '8px', height: '8px' }}></span>
            Highest Score
          </span>
          <span className="fw-bold theme-text">{highestScore}%</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-secondary" style={{ width: '8px', height: '8px' }}></span>
            Lowest Score
          </span>
          <span className="fw-bold theme-text">{lowestScore}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * ExamScoresViewer Component
 * Renders scores list and analytics distribution inline.
 */
const ExamScoresViewer = ({ examId, onBack, onGrade }) => {
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

  const getGradingStatus = (sub) => {
    if (!exam || !exam.questions) return { text: 'Unknown', className: 'review-pending' };
    
    const openEndedQuestions = exam.questions.filter(q => q.type === 'open_ended');
    if (openEndedQuestions.length === 0) {
      return { text: 'Auto-Graded', className: 'review-auto' };
    }
    
    const manualGrades = sub.manualGrades || {};
    const ungradedCount = openEndedQuestions.filter((q) => {
      const idx = exam.questions.findIndex(eq => eq.id === q.id);
      const key = q.id || idx;
      return manualGrades[key] === undefined || manualGrades[key] === '';
    }).length;
    
    if (ungradedCount === 0) {
      return { text: 'Graded', className: 'review-graded' };
    } else {
      return { text: `Pending (${ungradedCount} left)`, className: 'review-pending' };
    }
  };

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
      <div className="card portal-glass-card border-0">
        <div className="card-body p-5 text-center">
          <div className="spinner-border" role="status" style={{ color: 'var(--theme-color)' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2 small">Loading exam scores...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="card portal-glass-card border-0">
        <div className="card-body p-4">
          <div className="alert alert-danger mb-3">Exam not found.</div>
          <button className="btn btn-primary" onClick={onBack}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate descriptive statistics
  const totalCount = submissions.length;
  const passGrade = exam.passGrade || 50;
  const passCount = submissions.filter(s => s.score >= passGrade).length;
  const failCount = totalCount - passCount;

  const passPercent = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  const failPercent = totalCount > 0 ? 100 - passPercent : 0;

  const averageScore = totalCount > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalCount)
    : 0;

  const highestScore = totalCount > 0 ? Math.max(...submissions.map(s => s.score)) : 0;
  const lowestScore = totalCount > 0 ? Math.min(...submissions.map(s => s.score)) : 0;

  return (
    <div className="card portal-glass-card border-0 overflow-hidden">
      <style>{`
        .scores-header-card {
            background: var(--theme-gradient) !important;
            color: #ffffff;
            box-shadow: 0 10px 25px var(--theme-glow) !important;
        }
        .btn-toggle-charts {
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.35);
            color: #ffffff;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .btn-toggle-charts:hover {
            background: #ffffff;
            color: var(--theme-color);
            transform: translateY(-1px);
        }

        .analytics-block {
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid var(--theme-glow);
            border-radius: 14px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
        }

        .modern-scores-table {
            margin-bottom: 0;
            width: 100%;
        }
        .modern-scores-table th {
            font-weight: 700;
            font-size: 13.5px;
            color: var(--theme-color);
            background: var(--theme-glow) !important;
            padding: 12px 18px;
            border-bottom: 1.5px solid var(--theme-glow);
        }
        .modern-scores-table td {
            padding: 12px 18px;
            font-size: 13px;
            color: #334155;
            border-bottom: 1px solid #e2e8f0;
        }
        .modern-scores-table tr {
            transition: all 0.2s ease;
        }
        .modern-scores-table tr:hover {
            background-color: var(--theme-glow) !important;
        }
        .score-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 3.5px 9px;
            border-radius: 12px;
            text-transform: uppercase;
        }
        .score-pass {
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
        }
        .score-fail {
            background-color: #fef2f2;
            color: #ef4444;
            border: 1px solid #fca5a5;
        }
        .review-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 3.5px 9px;
            border-radius: 12px;
            text-transform: uppercase;
            display: inline-flex;
            align-items: center;
        }
        .review-graded {
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
        }
        .review-pending {
            background-color: #fffbeb;
            color: #d97706;
            border: 1px solid #fde68a;
        }
        .review-auto {
            background-color: #eef2ff;
            color: #4f46e5;
            border: 1px solid #c7d2fe;
        }

        .theme-text {
            color: var(--theme-color) !important;
        }

        .btn-grade-review {
            background: var(--theme-glow);
            border: 1px solid var(--theme-color);
            color: var(--theme-color);
            font-weight: 600;
            font-size: 12px;
            border-radius: 6px;
            padding: 5px 12px;
            transition: all 0.2s ease;
        }
        .btn-grade-review:hover {
            background: var(--theme-gradient);
            color: #ffffff;
            border-color: var(--theme-color);
            transform: translateY(-0.5px);
        }
      `}</style>

      <div className="card-header scores-header-card d-flex justify-content-between align-items-center p-4 border-0">
        <h4 className="fw-bold mb-0">
          Scores for: <span className="text-warning fw-semibold">{exam.title}</span>
        </h4>
        <div className="d-flex gap-2">
          {submissions.length > 0 && (
            <button
              className="btn btn-toggle-charts px-3 rounded-3 btn-sm"
              onClick={() => setShowCharts(!showCharts)}
            >
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
          )}
          <button className="btn btn-outline-light px-4 rounded-3 fw-semibold btn-sm" onClick={onBack}>
            Back to List
          </button>
        </div>
      </div>

      <div className="card-body p-4 p-md-5">
        {/* Charts & Analytics Section */}
        {showCharts && submissions.length > 0 && (
          <div className="analytics-block mb-4">
            <h5 className="mb-3 fw-bold text-dark" style={{ fontSize: '15px' }}>Exam Performance Analytics</h5>

            <div className="row g-3">
              {/* Left Column: Custom SVG Line Chart */}
              <div className="col-lg-8">
                <div className="bg-white p-3 rounded-3 border h-100">
                  <h6 className="text-muted mb-3 fw-semibold" style={{ fontSize: '12px' }}>Performance Distribution Graph (Scores)</h6>
                  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '220px' }}>
                    <ExamLineChart submissions={submissions} passGrade={passGrade} />
                  </div>
                </div>
              </div>

              {/* Right Column: Stacked Average Card and Donut Chart */}
              <div className="col-lg-4 d-flex flex-column gap-3">
                {/* Average Score Card */}
                <div className="card text-center border shadow-sm p-3 bg-white rounded-3">
                  <div className="text-muted mb-1 small fw-bold text-uppercase" style={{ fontSize: '10px' }}>Average Score</div>
                  <div className="fs-3 fw-bold theme-text">{averageScore}%</div>
                </div>

                {/* Pass/Fail Donut Chart Card */}
                <div className="bg-white p-3 rounded-3 border d-flex flex-column align-items-center justify-content-center flex-grow-1">
                  <h6 className="text-muted mb-3 fw-semibold text-center w-100" style={{ fontSize: '12px' }}>Pass/Fail Rate Ratio</h6>
                  <ExamDonutChart
                    passPercent={passPercent}
                    failPercent={failPercent}
                    passCount={passCount}
                    failCount={failCount}
                    highestScore={highestScore}
                    lowestScore={lowestScore}
                    passGrade={passGrade}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted mb-0">No submissions found for this exam.</p>
          </div>
        ) : (
          <div className="table-responsive border rounded-4 overflow-hidden">
            <table className="modern-scores-table table align-middle">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Submission Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Review Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="fw-semibold text-dark">{sub.studentName}</td>
                    <td>{formatDate(sub.submittedAt)}</td>
                    <td className="fw-bold theme-text">{sub.score}%</td>
                    <td>
                      {sub.score >= passGrade ? (
                        <span className="score-badge score-pass">Passed</span>
                      ) : (
                        <span className="score-badge score-fail">Failed</span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const status = getGradingStatus(sub);
                        return (
                          <span className={`review-badge ${status.className}`}>
                            {status.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-grade-review"
                        onClick={() => onGrade(sub.id)}
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
  );
};

export default ExamScoresViewer;
