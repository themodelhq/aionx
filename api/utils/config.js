import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Paths
  ROOT_DIR: join(__dirname, '../..'),
  DATA_DIR: process.env.DATA_DIR || join(__dirname, '../../data'),
  UPLOADS_DIR: process.env.UPLOADS_DIR || join(__dirname, '../../uploads'),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'aionx-super-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'aionx-refresh-secret-key-change-in-production',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // AI Services - Free Alternatives
  // OpenRouter (free models like llama-3.1-8b-instant)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instant', // Free model

  // Hugging Face (free inference API for images)
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '',
  HUGGINGFACE_API_URL: 'https://api-inference.huggingface.co/models',

  // Fallback for images (Pix2Pix, SD models)
  IMAGE_API_KEY: process.env.IMAGE_API_KEY || '',
  VIDEO_API_KEY: process.env.VIDEO_API_KEY || '',
  AUDIO_API_KEY: process.env.AUDIO_API_KEY || '',

  // Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],

  // Rate Limits
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX: 100,

  // Credits
  INITIAL_CREDITS: 100,
  IMAGE_CREDITS: 2,
  VIDEO_CREDITS: 5,
  AUDIO_CREDITS: 1,
  CHAT_CREDITS: 0
};
