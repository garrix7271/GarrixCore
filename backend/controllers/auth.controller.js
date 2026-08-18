// controllers/auth.controller.js — the actual logic behind each auth route.

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  findUserByEmail,
  createUser,
  updateUser,
  findUserByResetToken,
} = require('../utils/db');
const { sendResetEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// POST /api/signup
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (findUserByEmail(email)) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    const token = issueToken(user);
    return res.status(201).json({ token, name: user.name });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

// POST /api/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = issueToken(user);
    return res.status(200).json({ token, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

// POST /api/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = findUserByEmail(email);

    // Always respond the same way whether or not the account exists —
    // this avoids leaking which emails are registered.
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = Date.now() + RESET_TOKEN_TTL_MS;
      updateUser(email, { resetToken, resetTokenExpires });

      // Send the actual reset email via Resend.
      const resetLink = `${req.headers.origin || 'http://127.0.0.1:5500'}/reset-password.html?token=${resetToken}`;
      await sendResetEmail(email, resetLink);
    }

    return res.status(200).json({
      message: "If that email is registered, we've sent a reset link.",
    });
  } catch (err) {
    console.error('Forgot-password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

// POST /api/reset-password
async function resetPassword(req, res) {
  try {
    const { password, token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Missing or invalid reset link.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const user = findUserByResetToken(token);
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    updateUser(user.email, {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    });

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset-password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}

module.exports = { signup, login, forgotPassword, resetPassword };