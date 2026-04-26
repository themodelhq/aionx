// Custom error class
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found handler
export function notFoundHandler(req, res, next) {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
}

// Global error handler
export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log ALL errors always (not just dev) so Render logs show the real issue
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400, 'VALIDATION_ERROR');
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    error = new AppError('Database constraint violation', 400, 'CONSTRAINT_ERROR');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
}

// Async handler wrapper
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
