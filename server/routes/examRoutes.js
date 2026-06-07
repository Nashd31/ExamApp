const express = require('express');
const { getAllExams, getExamById, createExam, updateExam, adjustExam, deleteExam } = require('../controllers/examController');
const { protectRoute, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public/optionally authenticated list of exams
// (Uses protectRoute optionally, but we will make it public to prevent blockages if client headers aren't fully integrated, yet read req.user if present)
const optionalProtectRoute = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protectRoute(req, res, next);
  }
  next();
};

router.get('/', optionalProtectRoute, getAllExams);

// Strictly protected single exam view
router.get('/:id', protectRoute, getExamById);

// Teacher-only modification routes
router.post('/', protectRoute, requireRole('teacher'), createExam);
router.put('/:id', protectRoute, requireRole('teacher'), updateExam);
router.patch('/:id/adjust', protectRoute, requireRole('teacher'), adjustExam);
router.delete('/:id', protectRoute, requireRole('teacher'), deleteExam);

module.exports = router;
