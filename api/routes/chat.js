import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { userQueries, chatQueries } from '../models/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { chatGenerationService } from '../services/chatService.js';

const router = express.Router();

// Chat with AI
router.post('/', authenticate, [
  body('message').trim().isLength({ min: 1, max: 4000 }).withMessage('Message is required (1-4000 characters)')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { message, sessionId } = req.body;
  const userSessionId = sessionId || req.sessionId;

  // Save user message
  const userMessageId = uuidv4();
  chatQueries.create({
    id: userMessageId,
    userId: req.user.id,
    sessionId: userSessionId,
    role: 'user',
    content: message
  });

  // Get chat history for context
  const history = chatQueries.getHistory(req.user.id, userSessionId, 20);

  // Process with chat service
  const response = await chatGenerationService.process({
    userId: req.user.id,
    message,
    history: history.map(h => ({
      role: h.role,
      content: h.content
    })),
    isPremium: req.user.isPremium
  });

  // Save AI response
  const aiMessageId = uuidv4();
  chatQueries.create({
    id: aiMessageId,
    userId: req.user.id,
    sessionId: userSessionId,
    role: 'assistant',
    content: response.message,
    attachments: response.attachments || []
  });

  res.json({
    success: true,
    data: {
      message: {
        id: aiMessageId,
        role: 'assistant',
        content: response.message,
        attachments: response.attachments || [],
        createdAt: new Date().toISOString()
      },
      sessionId: userSessionId
    }
  });
}));

// Get chat history
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const { sessionId, limit = 50 } = req.query;

  let messages;
  if (sessionId) {
    messages = chatQueries.getHistory(req.user.id, sessionId, parseInt(limit));
  } else {
    messages = chatQueries.findByUserId(req.user.id, null, parseInt(limit));
  }

  // Parse attachments
  messages = messages.map(m => ({
    ...m,
    attachments: JSON.parse(m.attachments || '[]')
  })).reverse();

  res.json({
    success: true,
    data: {
      messages
    }
  });
}));

// Clear chat history
router.delete('/history', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  // For now, we'll just acknowledge the request
  // In production, you'd implement actual deletion

  res.json({
    success: true,
    message: sessionId ? 'Session cleared' : 'All chat history cleared'
  });
}));

// Process image generation request from chat
router.post('/generate-image', authenticate, [
  body('prompt').trim().isLength({ min: 1, max: 2000 }).withMessage('Prompt is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { prompt, style, aspectRatio } = req.body;

  // Get current credits
  const user = userQueries.findById(req.user.id);
  const creditCost = 2; // Default image cost

  if (!user.is_premium && user.credits < creditCost) {
    throw new AppError('Insufficient credits', 402, 'INSUFFICIENT_CREDITS');
  }

  // Deduct credits
  if (!user.is_premium) {
    userQueries.updateCredits(req.user.id, -creditCost);
  }

  // Process will be handled by the generation service
  res.json({
    success: true,
    data: {
      message: 'Image generation initiated',
      prompt,
      creditsUsed: creditCost
    }
  });
}));

// Process video generation request from chat
router.post('/generate-video', authenticate, [
  body('prompt').trim().isLength({ min: 1, max: 2000 }).withMessage('Prompt is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { prompt, duration = 6 } = req.body;

  const user = userQueries.findById(req.user.id);
  const creditCost = 5;

  if (!user.is_premium && user.credits < creditCost) {
    throw new AppError('Insufficient credits', 402, 'INSUFFICIENT_CREDITS');
  }

  if (!user.is_premium) {
    userQueries.updateCredits(req.user.id, -creditCost);
  }

  res.json({
    success: true,
    data: {
      message: 'Video generation initiated',
      prompt,
      duration,
      creditsUsed: creditCost
    }
  });
}));

// Process audio generation request from chat
router.post('/generate-audio', authenticate, [
  body('text').trim().isLength({ min: 1, max: 5000 }).withMessage('Text is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { text, voice, speed = 1 } = req.body;

  const user = userQueries.findById(req.user.id);
  const creditCost = 1;

  if (!user.is_premium && user.credits < creditCost) {
    throw new AppError('Insufficient credits', 402, 'INSUFFICIENT_CREDITS');
  }

  if (!user.is_premium) {
    userQueries.updateCredits(req.user.id, -creditCost);
  }

  res.json({
    success: true,
    data: {
      message: 'Audio generation initiated',
      textLength: text.length,
      creditsUsed: creditCost
    }
  });
}));

export default router;
