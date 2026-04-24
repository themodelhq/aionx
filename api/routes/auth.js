import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { config } from '../utils/config.js';
import { userQueries, sessionQueries } from '../models/database.js';
import { generateToken, hashToken, isValidEmail, generateAvatarUrl } from '../utils/helpers.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('displayName').trim().isLength({ min: 2, max: 50 }).withMessage('Display name must be 2-50 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Generate tokens
function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

// Register
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { email, password, displayName } = req.body;

  // Check if user exists
  const existingUser = userQueries.findByEmail(email);
  if (existingUser) {
    throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const userId = uuidv4();
  userQueries.create({
    id: userId,
    email,
    passwordHash,
    displayName: displayName || email.split('@')[0],
    credits: config.INITIAL_CREDITS
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(userId);

  // Store session
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  sessionQueries.create({
    id: sessionId,
    userId,
    tokenHash: hashToken(accessToken),
    expiresAt
  });

  // Get user data
  const user = userQueries.findById(userId);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url || generateAvatarUrl(user.display_name),
        isPremium: user.is_premium === 1,
        credits: user.credits
      },
      accessToken,
      refreshToken
    }
  });
}));

// Login
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { email, password } = req.body;

  // Find user
  const user = userQueries.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Store session
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  sessionQueries.create({
    id: sessionId,
    userId: user.id,
    tokenHash: hashToken(accessToken),
    expiresAt
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url || generateAvatarUrl(user.display_name),
        isPremium: user.is_premium === 1,
        credits: user.credits
      },
      accessToken,
      refreshToken
    }
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400, 'NO_REFRESH_TOKEN');
  }

  try {
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    // Find user
    const user = userQueries.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    // Store new session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    sessionQueries.create({
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(tokens.accessToken),
      expiresAt
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }
    throw error;
  }
}));

// Logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // Delete current session
  if (req.sessionId) {
    sessionQueries.delete(req.sessionId);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = userQueries.findById(req.user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url || generateAvatarUrl(user.display_name),
        isPremium: user.is_premium === 1,
        credits: user.credits
      }
    }
  });
}));

export default router;
