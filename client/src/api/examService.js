import { apiFetch } from '../services/apiClient';

/**
 * Retrieves all exams from the server.
 */
export const getAllExams = () => {
  return apiFetch('/exams');
};

/**
 * Retrieves a specific exam by its ID.
 */
export const getExamById = (id) => {
  return apiFetch(`/exams/${id}`);
};

/**
 * Creates a new exam.
 */
export const createExam = (exam) => {
  return apiFetch('/exams', {
    method: 'POST',
    body: exam
  });
};

/**
 * Updates an existing exam.
 */
export const updateExam = (updatedExam) => {
  return apiFetch(`/exams/${updatedExam.id}`, {
    method: 'PUT',
    body: updatedExam
  });
};

/**
 * Deletes an exam by its ID.
 */
export const deleteExam = (id) => {
  return apiFetch(`/exams/${id}`, {
    method: 'DELETE'
  });
};

/**
 * Submits student answers for grading.
 */
export const submitExam = (examId, studentName, studentAnswers, studentId = null) => {
  return apiFetch('/submissions', {
    method: 'POST',
    body: { examId, studentName, answers: studentAnswers, studentId }
  }).then(data => data.score);
};

/**
 * Retrieves student submissions.
 */
export const getStudentSubmissions = (studentName) => {
  return apiFetch(`/submissions/student/${encodeURIComponent(studentName)}`);
};

/**
 * Retrieves submissions associated with a specific exam.
 */
export const getExamSubmissions = (examId) => {
  return apiFetch(`/submissions/exam/${examId}`);
};

/**
 * Retrieves student submission for a given exam.
 */
export const getStudentSubmission = (examId, studentName) => {
  return apiFetch(`/submissions/exam/${examId}/student/${encodeURIComponent(studentName)}`);
};

/**
 * Retrieves submission by ID.
 */
export const getSubmissionById = (submissionId) => {
  return apiFetch(`/submissions/${submissionId}`);
};

/**
 * Updates a student's submission grade and feedback.
 */
export const updateSubmissionGrade = (submissionId, questionId, points, notes) => {
  return apiFetch(`/submissions/${submissionId}/grade`, {
    method: 'PUT',
    body: { questionId, points, notes }
  });
};

/**
 * Retrieves courses taught by a specific teacher.
 */
export const getCoursesByTeacher = (teacherId) => {
  return apiFetch(`/courses/teacher/${teacherId}`);
};

/**
 * Creates a new course.
 */
export const createCourse = (courseName, courseCode, teacherId) => {
  return apiFetch('/courses', {
    method: 'POST',
    body: { name: courseName, code: courseCode, teacherId }
  });
};


/**
 * Retrieves courses a student is enrolled in.
 */
export const getStudentEnrolledCourses = (studentId) => {
  return apiFetch(`/courses/student/${studentId}`);
};

/**
 * Unenrolls/removes a student from a course.
 */
export const unenrollStudentFromCourse = (studentId, courseId) => {
  return apiFetch(`/courses/${courseId}/student/${studentId}`, {
    method: 'DELETE'
  });
};

/**
 * Deletes a course.
 */
export const deleteCourse = (courseId) => {
  return apiFetch(`/courses/${courseId}`, {
    method: 'DELETE'
  });
};
