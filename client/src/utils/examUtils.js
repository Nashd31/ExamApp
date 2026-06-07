
// Computes the dynamic status of an exam based on the current system time compared to its scheduled start and end dates.
export const getExamStatus = (exam) => {
  if (!exam || !exam.startDate || !exam.endDate) {
    return 'Draft';
  }
  
  const currentTime = new Date();
  const start = new Date(exam.startDate);
  const end = new Date(exam.endDate);

  if (currentTime < start) {
    return 'Scheduled';
  } else if (currentTime >= start && currentTime <= end) {
    return 'Published';
  } else {
    return 'Done';
  }
};


// Formats an ISO datetime string into a user-friendly local date and time string.
export const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
