import { useState, useEffect, useRef } from 'react';

/**
 * CustomDateTimePicker Component
 * A premium, custom-styled calendar and clock dropdown.
 * Fully styled in emerald green with glassmorphic accents.
 * 
 * Props:
 * - value: ISO string of the selected date/time.
 * - onChange: callback function called with the new ISO date string.
 * - label: text label for the field.
 */
const CustomDateTimePicker = ({ value, onChange, label, alignRight = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date or default to now
  const initialDate = value ? new Date(value) : new Date();
  
  // States for selected date
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(initialDate.getMinutes());

  // View states for navigation (can differ from selected date)
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Update internal states when value prop changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedYear(d.getFullYear());
        setSelectedMonth(d.getMonth());
        setSelectedDay(d.getDate());
        setSelectedHour(d.getHours());
        setSelectedMinute(d.getMinutes());
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Format value for display in the input box
  const formatDisplay = () => {
    if (!value) return 'Select Date & Time';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Select Date & Time';
    
    const pad = (num) => String(num).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Trigger the onChange callback with formatted ISO String
  const updateDateTime = (y, m, d, hr, min) => {
    const dateObj = new Date(y, m, d, hr, min);
    onChange(dateObj.toISOString());
  };

  // Month navigation
  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Generate days array
  const calendarCells = [];
  // Add empty prefix cells for alignment
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push({ value: null, key: `empty-${i}` });
  }
  // Add days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ value: d, key: `day-${d}` });
  }

  const handleDaySelect = (dayVal) => {
    setSelectedDay(dayVal);
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    updateDateTime(viewYear, viewMonth, dayVal, selectedHour, selectedMinute);
  };

  const handleTimeChange = (type, val) => {
    let numVal = parseInt(val, 10);
    if (isNaN(numVal)) numVal = 0;

    if (type === 'hour') {
      const fixedHour = Math.max(0, Math.min(23, numVal));
      setSelectedHour(fixedHour);
      updateDateTime(selectedYear, selectedMonth, selectedDay, fixedHour, selectedMinute);
    } else if (type === 'minute') {
      const fixedMin = Math.max(0, Math.min(59, numVal));
      setSelectedMinute(fixedMin);
      updateDateTime(selectedYear, selectedMonth, selectedDay, selectedHour, fixedMin);
    }
  };

  return (
    <div className="custom-dt-container" ref={containerRef}>
      <style>{`
        .custom-dt-container {
          position: relative;
          width: 100%;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .custom-dt-trigger {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          cursor: pointer;
          text-align: left;
          background: rgba(255, 255, 255, 0.7) !important;
        }
        .custom-dt-trigger:focus, .custom-dt-trigger.open {
          border-color: #10b981 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12) !important;
          outline: none;
        }
        
        /* Dropdown Panel */
        .custom-dt-panel {
          position: absolute;
          top: calc(100% + 8px);
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(16, 185, 129, 0.18);
          border-radius: 16px;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
          z-index: 1100;
          padding: 20px;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: pickerSlideIn 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .custom-dt-panel.align-left {
          left: 0;
        }
        .custom-dt-panel.align-right {
          right: 0;
        }
        @keyframes pickerSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Calendar Header */
        .picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .picker-header-title {
          font-weight: 700;
          font-size: 15px;
          color: #1e293b;
          margin: 0;
        }
        .picker-nav-btn {
          border: none;
          background: rgba(148, 163, 184, 0.08);
          color: #475569;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .picker-nav-btn:hover {
          background-color: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        /* Calendar Grid */
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          text-align: center;
        }
        .calendar-weekday {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          padding: 4px 0;
        }
        .calendar-day {
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          border-radius: 50%;
          cursor: pointer;
          color: #334155;
          transition: all 0.18s ease;
          user-select: none;
        }
        .calendar-day:hover:not(.empty) {
          background-color: rgba(16, 185, 129, 0.08);
          color: #059669;
        }
        .calendar-day.selected {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: #ffffff !important;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
        }
        .calendar-day.empty {
          cursor: default;
        }

        /* Time Picker Panel */
        .time-picker-panel {
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          padding-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .time-picker-label {
          font-weight: 700;
          font-size: 13px;
          color: #475569;
          margin-right: auto;
        }
        .time-input-wrapper {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 8px;
          padding: 4px 8px;
        }
        .time-spinner-input {
          width: 38px;
          border: none;
          background: transparent;
          text-align: center;
          font-weight: 700;
          font-size: 14.5px;
          color: #1e293b;
          outline: none;
        }
        .time-spinner-input::-webkit-outer-spin-button,
        .time-spinner-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .time-separator {
          font-weight: 700;
          font-size: 15px;
          color: #94a3b8;
          padding: 0 2px;
        }

        /* Set Button */
        .btn-dt-set {
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.18);
        }
        .btn-dt-set:hover {
          transform: translateY(-0.5px);
          box-shadow: 0 6px 14px rgba(16, 185, 129, 0.25);
        }
      `}</style>

      {label && <label className="form-label small fw-semibold text-secondary mb-1.5">{label}</label>}

      <button
        type="button"
        className={`form-control modern-form-control custom-dt-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{formatDisplay()}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {isOpen && (
        <div className={`custom-dt-panel ${alignRight ? 'align-right' : 'align-left'}`}>
          {/* Header */}
          <div className="picker-header">
            <button className="picker-nav-btn" type="button" onClick={prevMonth}>
              &larr;
            </button>
            <p className="picker-header-title">
              {monthsList[viewMonth]} {viewYear}
            </p>
            <button className="picker-nav-btn" type="button" onClick={nextMonth}>
              &rarr;
            </button>
          </div>

          {/* Grid */}
          <div className="calendar-grid">
            {/* Weekdays */}
            {daysOfWeek.map(w => (
              <span key={w} className="calendar-weekday">
                {w}
              </span>
            ))}
            {/* Calendar Days */}
            {calendarCells.map(c => {
              const isSelected = 
                c.value !== null && 
                selectedDay === c.value && 
                selectedMonth === viewMonth && 
                selectedYear === viewYear;
              
              if (c.value === null) {
                return <span key={c.key} className="calendar-day empty"></span>;
              }
              
              return (
                <span
                  key={c.key}
                  className={`calendar-day ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleDaySelect(c.value)}
                >
                  {c.value}
                </span>
              );
            })}
          </div>

          {/* Time Picker */}
          <div className="time-picker-panel">
            <span className="time-picker-label">Time</span>
            <div className="time-input-wrapper">
              <input
                type="number"
                min="0"
                max="23"
                className="time-spinner-input"
                value={String(selectedHour).padStart(2, '0')}
                onChange={(e) => handleTimeChange('hour', e.target.value)}
              />
              <span className="time-separator">:</span>
              <input
                type="number"
                min="0"
                max="59"
                className="time-spinner-input"
                value={String(selectedMinute).padStart(2, '0')}
                onChange={(e) => handleTimeChange('minute', e.target.value)}
              />
            </div>
          </div>

          {/* Close/Set Button */}
          <button
            type="button"
            className="btn-dt-set"
            onClick={() => setIsOpen(false)}
          >
            Apply Date & Time
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomDateTimePicker;
