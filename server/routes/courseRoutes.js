const express = require('express');
const {
  getAllCourses,
  getCoursesByTeacher,
  createCourse,
  enrollStudent,
  getStudentCourses,
  unenrollStudent,
  deleteCourse
} = require('../controllers/courseController');
const { protectRoute, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public course list
router.get('/', getAllCourses);

// Student course lookup and enrollment
router.get('/student/:studentId', protectRoute, getStudentCourses);
router.post('/enroll', protectRoute, enrollStudent);
router.delete('/:courseId/student/:studentId', protectRoute, unenrollStudent);

// Teacher courses lookup and management
router.get('/teacher/:teacherId', protectRoute, getCoursesByTeacher);
router.post('/', protectRoute, requireRole('teacher'), createCourse);
router.delete('/:id', protectRoute, requireRole('teacher'), deleteCourse);

module.exports = router;
