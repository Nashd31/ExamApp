import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamById, getExamSubmissions } from '../api/examService';
import { showError } from '../services/notify';

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

  // Map submissions to SVG coordinate points
  const points = submissions.map((sub, i) => {
    const x = paddingLeft + (submissions.length > 1 ? (i / (submissions.length - 1)) * chartWidth : chartWidth / 2);
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
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        {/* Shaded area gradient */}
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
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
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              strokeOpacity="0.75"
            />
            <text
              x={width - paddingRight - 5}
              y={y - 4}
              fill="#10b981"
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
              fill={isHovered ? (isPassed ? "#10b981" : "#ef4444") : "#ffffff"}
              stroke={isPassed ? "#10b981" : "#ef4444"}
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
const ExamDonutChart = ({ passPercent, failPercent, passCount, failCount, highestScore, lowestScore }) => {
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~282.74

  const passDash = (passPercent / 100) * circumference;
  const failDash = circumference - passDash;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center w-100">
      <div className="position-relative" style={{ width: '120px', height: '120px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
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
              stroke="#10b981"
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
            <span className="d-inline-block rounded-circle bg-success" style={{ width: '10px', height: '10px' }}></span>
            Passed
          </span>
          <span className="fw-bold text-success">{passPercent}% ({passCount})</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-danger" style={{ width: '10px', height: '10px' }}></span>
            Failed
          </span>
          <span className="fw-bold text-danger">{failPercent}% ({failCount})</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-primary" style={{ width: '10px', height: '10px' }}></span>
            Highest Score
          </span>
          <span className="fw-bold text-primary">{highestScore}%</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-1">
          <span className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle bg-primary" style={{ width: '10px', height: '10px' }}></span>
            Lowest Score
          </span>
          <span className="fw-bold text-primary">{lowestScore}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * ExamScores Component
 * Main page listing student submissions and showing visual performance analytics.
 */
const ExamScores = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

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
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading scores...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Exam not found.</div>
        <button className="btn btn-primary" onClick={() => navigate('/teacher')}>Back to Dashboard</button>
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
    <div className="container mt-4 mb-5">
      <div className="card shadow rounded-4">
        <div className="card-header bg-info text-white d-flex justify-content-between align-items-center p-4 rounded-top-4">
          <h3 className="mb-0">Scores for: {exam.title}</h3>
          <div className="d-flex gap-2">
            {submissions.length > 0 && (
              <button
                className="btn btn-outline-light px-3 fw-semibold"
                onClick={() => setShowCharts(!showCharts)}
              >
                {showCharts ? 'Hide Charts' : 'Show Charts'}
              </button>
            )}
            <button className="btn btn-outline-light px-4" onClick={() => navigate('/teacher')}>Back to Exams</button>
          </div>
        </div>
        <div className="card-body px-5 py-4">

          {/* Charts & Analytics Section */}
          {showCharts && submissions.length > 0 && (
            <div className="mb-5 p-4 bg-light rounded-4 border">
              <h5 className="mb-4 text-secondary fw-semibold border-bottom pb-2">Exam Analytics</h5>

              {/* Graphic charts & Stacking row */}
              <div className="row g-4">
                {/* Left Column: Custom SVG Line Chart */}
                <div className="col-lg-8">
                  <div className="bg-white p-4 rounded-3 shadow-sm border h-100">
                    <h6 className="text-muted mb-3 fw-semibold">Performance Distribution Graph (Scores)</h6>
                    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '220px' }}>
                      <ExamLineChart submissions={submissions} passGrade={passGrade} />
                    </div>
                  </div>
                </div>

                {/* Right Column: Stacked Average Card and Donut Chart */}
                <div className="col-lg-4 d-flex flex-column gap-3">
                  {/* Average Score Card */}
                  <div className="card text-center border shadow-sm p-4 bg-white rounded-3">
                    <div className="text-muted mb-1 small fw-bold text-uppercase">Average Score</div>
                    <div className="fs-2 fw-bold text-primary">{averageScore}%</div>
                  </div>

                  {/* Pass/Fail Donut Chart Card */}
                  <div className="bg-white p-4 rounded-3 shadow-sm border d-flex flex-column align-items-center justify-content-center flex-grow-1">
                    <h6 className="text-muted mb-3 fw-semibold text-center w-100">Pass/Fail Rate Ratio</h6>
                    <ExamDonutChart
                      passPercent={passPercent}
                      failPercent={failPercent}
                      passCount={passCount}
                      failCount={failCount}
                      highestScore={highestScore}
                      lowestScore={lowestScore}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {submissions.length === 0 ? (
            <p className="text-muted text-center my-4">No submissions found for this exam.</p>
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
                  {submissions.map((sub, idx) => (
                    <tr key={idx}>
                      <td>{sub.studentName}</td>
                      <td>{sub.score}%</td>
                      <td>
                        {sub.score >= passGrade ? (
                          <span className="badge bg-success">Passed</span>
                        ) : (
                          <span className="badge bg-danger">Failed</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => navigate(`/grade/${sub.id}`)}
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
    </div>
  );
};

export default ExamScores;
