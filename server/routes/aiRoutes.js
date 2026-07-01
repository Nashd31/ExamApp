const express = require('express');
const { generateExam } = require('../controllers/aiController');
const { protectRoute, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /generate-exam - generates exam questions from natural language. Protected to teacher only.
router.post('/generate-exam', protectRoute, requireRole('teacher'), generateExam);

module.exports = router;
