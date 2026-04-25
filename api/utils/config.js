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

  // AI Services
  // Groq (for chat - fast and free tier available)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama3-8b-8192',

  // ZSky AI (for image and video generation)
  ZSKY_API_KEY: process.env.ZSKY_API_KEY || '',
  ZSKY_API_URL: process.env.ZSKY_API_URL || 'https://api.zsky.ai/v1',

  // Hugging Face (fallback for images)
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '',
  HUGGINGFACE_API_URL: 'https://api-inference.huggingface.co/models',

  // Gemini / Google Cloud TTS (for audio)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

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
