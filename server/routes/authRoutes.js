const express = require('express');
const { login, register, updateProfile } = require('../controllers/authController');
const { protectRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// Public auth routes
router.post('/login', login);
router.post('/register', register);

// Protected profile update route
router.put('/profile/:id', protectRoute, updateProfile);

module.exports = router;
