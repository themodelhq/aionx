import jwt from 'jsonwebtoken';
import { config } from '../utils/config.js';
import { sessionQueries } from '../models/database.js';
import { hashToken } from '../utils/helpers.js';
import { AppError } from './errorHandler.js';

// Verify JWT token
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Check session exists and is valid
    const tokenHash = hashToken(token);
    const session = sessionQueries.findValidByTokenHash(tokenHash);

    if (!session) {
      throw new AppError('Invalid or expired session', 401, 'INVALID_SESSION');
    }

    // Attach user to request
    req.user = {
      id: session.user_id,
      email: session.email,
      displayName: session.display_name,
      isPremium: session.is_premium === 1,
      credits: session.credits
    };

    req.sessionId = session.id;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }
}

// Optional authentication (doesn't fail if no token)
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const tokenHash = hashToken(token);
    const session = sessionQueries.findValidByTokenHash(tokenHash);

    if (session) {
      req.user = {
        id: session.user_id,
        email: session.email,
        displayName: session.display_name,
        isPremium: session.is_premium === 1,
        credits: session.credits
      };
      req.sessionId = session.id;
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
}

// Check if user is premium
export function requirePremium(req, res, next) {
  if (!req.user || !req.user.isPremium) {
    return next(new AppError('Premium subscription required', 403, 'PREMIUM_REQUIRED'));
  }
  next();
}

// Check credits
export function requireCredits(amount) {
  return (req, res, next) => {
    if (req.user.isPremium) {
      return next(); // Premium users have unlimited credits
    }

    if (req.user.credits < amount) {
      return next(new AppError(`Insufficient credits. Need ${amount}, have ${req.user.credits}`, 402, 'INSUFFICIENT_CREDITS'));
    }
    next();
  };
}

// Rate limiting by user
export function rateLimitByUser(maxRequests = 100, windowMs = 60000) {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return next(new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED'));
    }

    recentRequests.push(now);
    requests.set(userId, recentRequests);
    next();
  };
}
