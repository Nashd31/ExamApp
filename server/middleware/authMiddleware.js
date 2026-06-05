const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes by validating the JWT token.
 * Extracts the JWT from the 'Authorization' header, verifies it, and attaches the payload to req.user.
 */
const protectRoute = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT Verification error:', err.message);
    return res.status(401).json({ error: 'Token is invalid or expired.' });
  }
};

/**
 * Middleware to restrict route access to specific roles.
 * Supports checking a single role or an array of roles against req.user.role.
 * @param {string|string[]} allowedRoles - Role or list of roles allowed to access the route
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }

    next();
  };
};

module.exports = {
  protectRoute,
  requireRole
};
