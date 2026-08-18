// middleware/auth.middleware.js — protects routes that require a logged-in user.
// Reads the "Authorization: Bearer <token>" header, verifies it, and attaches
// the user's id to req.userId so controllers know who's making the request.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'You must be signed in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = { requireAuth };