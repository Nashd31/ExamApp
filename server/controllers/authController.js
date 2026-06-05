const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Registers a new user in the system.
 * Hashes the password and saves the user. Generates and returns a JWT token.
 */
const register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields (name, email, password, role) are required.' });
  }

  try {
    // Check if email already exists
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Default theme colors and avatar based on role
    const avatar = 'initials';
    const themeColor = role === 'teacher' ? 'emerald' : 'indigo';

    // Insert new user
    const result = await db.query(`
      INSERT INTO users (email, password_hash, name, role, avatar, theme_color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, role, avatar, theme_color
    `, [email, passwordHash, name, role, avatar, themeColor]);

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Format response matching frontend expectations
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      themeColor: user.theme_color,
      enrolledCourses: role === 'student' ? [] : undefined,
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticates user credentials.
 * Compares passwords and returns user payload + JWT token.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Fetch user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Fetch enrolled courses if user is a student
    let enrolledCourses = [];
    if (user.role === 'student') {
      const enrollmentResult = await db.query(
        'SELECT course_id FROM user_courses WHERE student_id = $1',
        [user.id]
      );
      enrolledCourses = enrollmentResult.rows.map(r => r.course_id);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Format response matching frontend expectations
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      themeColor: user.theme_color,
      enrolledCourses: user.role === 'student' ? enrolledCourses : undefined,
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Updates details in the authenticated user's profile.
 * Hashes new password if provided.
 */
const updateProfile = async (req, res, next) => {
  const { id } = req.params;
  const { name, password, avatar, themeColor } = req.body;

  // Authorization check: Make sure req.user.id matches params.id or role is admin/teacher
  if (req.user.id !== parseInt(id, 10)) {
    return res.status(403).json({ error: 'Unauthorized profile update.' });
  }

  try {
    let result;
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      result = await db.query(`
        UPDATE users 
        SET name = $1, password_hash = $2, avatar = $3, theme_color = $4 
        WHERE id = $5 
        RETURNING id, email, name, role, avatar, theme_color
      `, [name, passwordHash, avatar, themeColor, id]);
    } else {
      result = await db.query(`
        UPDATE users 
        SET name = $1, avatar = $2, theme_color = $3 
        WHERE id = $4 
        RETURNING id, email, name, role, avatar, theme_color
      `, [name, avatar, themeColor, id]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    // Fetch enrolled courses if student
    let enrolledCourses = [];
    if (user.role === 'student') {
      const enrollmentResult = await db.query(
        'SELECT course_id FROM user_courses WHERE student_id = $1',
        [user.id]
      );
      enrolledCourses = enrollmentResult.rows.map(r => r.course_id);
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      themeColor: user.theme_color,
      enrolledCourses: user.role === 'student' ? enrolledCourses : undefined
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  updateProfile
};
