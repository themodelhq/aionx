import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config.js';
import { userQueries, generationQueries } from '../models/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { imageGenerationService } from '../services/imageService.js';
import { videoGenerationService } from '../services/videoService.js';
import { audioGenerationService } from '../services/audioService.js';

const router = express.Router();

// Validation
const generationValidation = [
  body('prompt').trim().isLength({ min: 1, max: 2000 }).withMessage('Prompt is required (1-2000 characters)')
];

// Credit costs
const CREDIT_COSTS = {
  image: config.IMAGE_CREDITS,
  video: config.VIDEO_CREDITS,
  audio: config.AUDIO_CREDITS,
  chat: config.CHAT_CREDITS
};

// Get all generations
router.get('/', authenticate, [
  query('type').optional().isIn(['image', 'video', 'audio', 'chat']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const { type, limit = 50, offset = 0 } = req.query;

  let generations;
  if (type) {
    generations = generationQueries.findByUserIdAndType(req.user.id, type, parseInt(limit), parseInt(offset));
  } else {
    generations = generationQueries.findByUserId(req.user.id, parseInt(limit), parseInt(offset));
  }

  // Parse parameters JSON
  generations = generations.map(g => ({
    ...g,
    parameters: JSON.parse(g.parameters || '{}')
  }));

  res.json({
    success: true,
    data: {
      generations,
      count: generations.length
    }
  });
}));

// Get single generation
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const generation = generationQueries.findById(req.params.id);

  if (!generation) {
    throw new AppError('Generation not found', 404, 'NOT_FOUND');
  }

  if (generation.user_id !== req.user.id) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  res.json({
    success: true,
    data: {
      generation: {
        ...generation,
        parameters: JSON.parse(generation.parameters || '{}')
      }
    }
  });
}));

// Generate image
router.post('/image', authenticate, generationValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { prompt, style, aspectRatio, quality, numImages = 1 } = req.body;
  const creditCost = CREDIT_COSTS.image * numImages;

  // Check credits
  if (!req.user.isPremium && req.user.credits < creditCost) {
    throw new AppError(`Insufficient credits. Need ${creditCost}, have ${req.user.credits}`, 402, 'INSUFFICIENT_CREDITS');
  }

  // Create generation record
  const generationId = uuidv4();
  generationQueries.create({
    id: generationId,
    userId: req.user.id,
    type: 'image',
    prompt,
    parameters: { style, aspectRatio, quality, numImages },
    status: 'processing',
    creditsUsed: creditCost
  });

  // Deduct credits
  if (!req.user.isPremium) {
    userQueries.updateCredits(req.user.id, -creditCost);
  }

  // Start generation (async)
  imageGenerationService.generate({
    id: generationId,
    prompt,
    style,
    aspectRatio,
    quality,
    numImages
  }).then(async (results) => {
    // Update generation with results
    generationQueries.update(generationId, {
      status: 'completed',
      result_url: results[0]?.url,
      thumbnail_url: results[0]?.url
    });
  }).catch(async (error) => {
    generationQueries.update(generationId, {
      status: 'failed',
      error_message: error.message
    });
    // Refund credits
    if (!req.user.isPremium) {
      userQueries.updateCredits(req.user.id, creditCost);
    }
  });

  res.status(202).json({
    success: true,
    data: {
      generationId,
      status: 'processing',
      message: 'Image generation started'
    }
  });
}));

// Generate video
router.post('/video', authenticate, generationValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { prompt, imageUrl, duration = 6, resolution = '768P', motionStyle = 'cinematic' } = req.body;
  const creditCost = CREDIT_COSTS.video;

  // Check credits
  if (!req.user.isPremium && req.user.credits < creditCost) {
    throw new AppError(`Insufficient credits. Need ${creditCost}, have ${req.user.credits}`, 402, 'INSUFFICIENT_CREDITS');
  }

  // Create generation record
  const generationId = uuidv4();
  generationQueries.create({
    id: generationId,
    userId: req.user.id,
    type: 'video',
    prompt,
    parameters: { imageUrl, duration, resolution, motionStyle },
    status: 'processing',
    creditsUsed: creditCost
  });

  // Deduct credits
  if (!req.user.isPremium) {
    userQueries.updateCredits(req.user.id, -creditCost);
  }

  // Start generation (async)
  videoGenerationService.generate({
    id: generationId,
    prompt,
    imageUrl,
    duration,
    resolution,
    motionStyle
  }).then(async (result) => {
    generationQueries.update(generationId, {
      status: 'completed',
      result_url: result.url,
      thumbnail_url: result.thumbnail
    });
  }).catch(async (error) => {
    generationQueries.update(generationId, {
      status: 'failed',
      error_message: error.message
    });
    if (!req.user.isPremium) {
      userQueries.updateCredits(req.user.id, creditCost);
    }
  });

  res.status(202).json({
    success: true,
    data: {
      generationId,
      status: 'processing',
      message: 'Video generation started'
    }
  });
}));

// Generate audio (TTS)
router.post('/audio', authenticate, [
  body('text').trim().isLength({ min: 1, max: 5000 }).withMessage('Text is required (1-5000 characters)')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR');
  }

  const { text, voice, speed = 1, emotion = 'neutral' } = req.body;
  const creditCost = CREDIT_COSTS.audio;

  // Check credits
  if (!req.user.isPremium && req.user.credits < creditCost) {
    throw new AppError(`Insufficient credits. Need ${creditCost}, have ${req.user.credits}`, 402, 'INSUFFICIENT_CREDITS');
  }

  // Create generation record
  const generationId = uuidv4();
  generationQueries.create({
    id: generationId,
    userId: req.user.id,
    type: 'audio',
    prompt: text.substring(0, 200),
    parameters: { voice, speed, emotion },
    status: 'processing',
    creditsUsed: creditCost
  });

  // Deduct credits
  if (!req.user.isPremium) {
    userQueries.updateCredits(req.user.id, -creditCost);
  }

  // Start generation (async)
  audioGenerationService.generate({
    id: generationId,
    text,
    voice,
    speed,
    emotion
  }).then(async (result) => {
    generationQueries.update(generationId, {
      status: 'completed',
      result_url: result.url
    });
  }).catch(async (error) => {
    generationQueries.update(generationId, {
      status: 'failed',
      error_message: error.message
    });
    if (!req.user.isPremium) {
      userQueries.updateCredits(req.user.id, creditCost);
    }
  });

  res.status(202).json({
    success: true,
    data: {
      generationId,
      status: 'processing',
      message: 'Audio generation started'
    }
  });
}));

// Delete generation
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const generation = generationQueries.findById(req.params.id);

  if (!generation) {
    throw new AppError('Generation not found', 404, 'NOT_FOUND');
  }

  if (generation.user_id !== req.user.id) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  generationQueries.delete(req.params.id);

  res.json({
    success: true,
    message: 'Generation deleted'
  });
}));

// Get generation status
router.get('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const generation = generationQueries.findById(req.params.id);

  if (!generation) {
    throw new AppError('Generation not found', 404, 'NOT_FOUND');
  }

  if (generation.user_id !== req.user.id) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  res.json({
    success: true,
    data: {
      id: generation.id,
      status: generation.status,
      resultUrl: generation.result_url,
      thumbnailUrl: generation.thumbnail_url,
      errorMessage: generation.error_message
    }
  });
}));

export default router;
