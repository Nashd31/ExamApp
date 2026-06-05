const express = require('express');
const {
  submitExam,
  getMySubmissions,
  getExamSubmissions,
  getStudentExamSubmission,
  getSubmissionById,
  updateManualGrade
} = require('../controllers/submissionController');
const { protectRoute, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Student submission endpoints
router.post('/', protectRoute, requireRole('student'), submitExam);
router.get('/mine', protectRoute, requireRole('student'), getMySubmissions);

// Backwards compatibility endpoint for student submissions
router.get('/student/:studentName', protectRoute, getMySubmissions);

// Submissions retrieval for teachers / students
router.get('/exam/:examId', protectRoute, requireRole('teacher'), getExamSubmissions);
router.get('/exam/:examId/student/:studentName', protectRoute, getStudentExamSubmission);
router.get('/:id', protectRoute, getSubmissionById);

// Teacher manual grading
router.put('/:id/grade', protectRoute, requireRole('teacher'), updateManualGrade);

module.exports = router;
