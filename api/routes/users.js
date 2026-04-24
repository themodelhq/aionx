import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { userQueries } from '../models/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { generateAvatarUrl } from '../utils/helpers.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
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
        credits: user.credits,
        createdAt: user.created_at
      }
    }
  });
}));

// Update user profile
router.put('/profile', authenticate, [
  body('displayName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Display name must be 2-50 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { displayName } = req.body;
  const updates = {};

  if (displayName) {
    updates.display_name = displayName;
  }

  if (Object.keys(updates).length > 0) {
    userQueries.update(req.user.id, updates);
  }

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

// Change password
router.put('/password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { currentPassword, newPassword } = req.body;

  // Get current user
  const user = userQueries.findById(req.user.id);

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  userQueries.update(req.user.id, { password_hash: newPasswordHash });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Add credits (admin/demo functionality)
router.post('/credits', authenticate, asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new AppError('Valid amount is required', 400, 'INVALID_AMOUNT');
  }

  // Only allow self or demo user to add credits
  if (!req.user.isPremium && amount > 100) {
    throw new AppError('Maximum 100 credits at a time for non-premium users', 400, 'LIMIT_EXCEEDED');
  }

  userQueries.updateCredits(req.user.id, amount);
  const user = userQueries.findById(req.user.id);

  res.json({
    success: true,
    data: {
      credits: user.credits
    }
  });
}));

export default router;
