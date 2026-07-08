import config from '../services/config';
import { apiFetch } from '../services/apiClient';
import * as mockExam from './mock/examService';

/**
 * Retrieves exams from the server. If teacherId is provided, fetches only that teacher's exams.
 */
export const getAllExams = (teacherId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getAllExams(teacherId);
  }
  const url = teacherId ? `/exams?teacherId=${teacherId}` : '/exams';
  return apiFetch(url);
};

/**
 * Retrieves a specific exam by its ID.
 */
export const getExamById = (id) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getExamById(id);
  }
  return apiFetch(`/exams/${id}`);
};

/**
 * Creates a new exam.
 */
export const createExam = (exam) => {
  if (!config.USE_SERVER_API) {
    return mockExam.createExam(exam);
  }
  return apiFetch('/exams', {
    method: 'POST',
    body: exam
  });
};

/**
 * Updates an existing exam.
 */
export const updateExam = (updatedExam) => {
  if (!config.USE_SERVER_API) {
    return mockExam.updateExam(updatedExam);
  }
  return apiFetch(`/exams/${updatedExam.id}`, {
    method: 'PUT',
    body: updatedExam
  });
};

/**
 * Deletes an exam by its ID.
 */
export const deleteExam = (id) => {
  if (!config.USE_SERVER_API) {
    return mockExam.deleteExam(id);
  }
  return apiFetch(`/exams/${id}`, {
    method: 'DELETE'
  });
};

/**
 * Submits student answers for grading.
 */
export const submitExam = (examId, studentName, studentAnswers, studentId = null) => {
  if (!config.USE_SERVER_API) {
    return mockExam.submitExam(examId, studentName, studentAnswers, studentId);
  }
  return apiFetch('/submissions', {
    method: 'POST',
    body: { examId, studentName, answers: studentAnswers, studentId }
  }).then(data => data.score);
};

/**
 * Retrieves student submissions.
 */
export const getStudentSubmissions = (studentName) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getStudentSubmissions(studentName);
  }
  return apiFetch(`/submissions/student/${encodeURIComponent(studentName)}`);
};

/**
 * Retrieves submissions associated with a specific exam.
 */
export const getExamSubmissions = (examId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getExamSubmissions(examId);
  }
  return apiFetch(`/submissions/exam/${examId}`);
};

/**
 * Retrieves student submission for a given exam.
 */
export const getStudentSubmission = (examId, studentName) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getStudentSubmission(examId, studentName);
  }
  return apiFetch(`/submissions/exam/${examId}/student/${encodeURIComponent(studentName)}`);
};

/**
 * Retrieves submission by ID.
 */
export const getSubmissionById = (submissionId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getSubmissionById(submissionId);
  }
  return apiFetch(`/submissions/${submissionId}`);
};

/**
 * Updates a student's submission grade and feedback.
 */
export const updateSubmissionGrade = (submissionId, questionId, points, notes) => {
  if (!config.USE_SERVER_API) {
    return mockExam.updateSubmissionGrade(submissionId, questionId, points, notes);
  }
  return apiFetch(`/submissions/${submissionId}/grade`, {
    method: 'PUT',
    body: { questionId, points, notes }
  });
};

/**
 * Retrieves courses taught by a specific teacher.
 */
export const getCoursesByTeacher = (teacherId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getCoursesByTeacher(teacherId);
  }
  return apiFetch(`/courses/teacher/${teacherId}`);
};

/**
 * Creates a new course.
 */
export const createCourse = (courseName, courseCode, teacherId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.createCourse(courseName, courseCode, teacherId);
  }
  return apiFetch('/courses', {
    method: 'POST',
    body: { name: courseName, code: courseCode, teacherId }
  });
};

/**
 * Retrieves courses a student is enrolled in.
 */
export const getStudentEnrolledCourses = (studentId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.getStudentEnrolledCourses(studentId);
  }
  return apiFetch(`/courses/student/${studentId}`);
};

/**
 * Unenrolls/removes a student from a course.
 */
export const unenrollStudentFromCourse = (studentId, courseId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.unenrollStudentFromCourse(studentId, courseId);
  }
  return apiFetch(`/courses/${courseId}/student/${studentId}`, {
    method: 'DELETE'
  });
};

/**
 * Adjusts exam settings (title, duration, endDate, passGrade, factor).
 */
export const adjustExam = (examId, adjustments) => {
  if (!config.USE_SERVER_API) {
    return mockExam.adjustExam(examId, adjustments);
  }
  return apiFetch(`/exams/${examId}/adjust`, {
    method: 'PATCH',
    body: adjustments
  });
};

/**
 * Deletes a course.
 */
export const deleteCourse = (courseId) => {
  if (!config.USE_SERVER_API) {
    return mockExam.deleteCourse(courseId);
  }
  return apiFetch(`/courses/${courseId}`, {
    method: 'DELETE'
  });
};