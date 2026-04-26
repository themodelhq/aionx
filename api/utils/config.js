import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug: log which AI keys are present at startup (masked)
const maskKey = (key) => key ? `${key.substring(0, 6)}...${key.slice(-4)} (len:${key.length})` : 'NOT SET';
console.log('[Config] GROQ_API_KEY:', maskKey(process.env.GROQ_API_KEY));
console.log('[Config] GEMINI_API_KEY:', maskKey(process.env.GEMINI_API_KEY));
console.log('[Config] MAGIC_HOUR_API_KEY:', maskKey(process.env.MAGIC_HOUR_API_KEY));
console.log('[Config] TAVUS_API_KEY:', maskKey(process.env.TAVUS_API_KEY));

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
  // Groq (for chat)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Gemini (for images via Imagen, and audio via Google Cloud TTS)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Magic Hour (for general video generation)
  MAGIC_HOUR_API_KEY: process.env.MAGIC_HOUR_API_KEY || '',

  // Tavus (for avatar/conversational video generation)
  TAVUS_API_KEY: process.env.TAVUS_API_KEY || '',
  TAVUS_REPLICA_ID: process.env.TAVUS_REPLICA_ID || '',

  // Hugging Face (fallback for images if needed)
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '',
  HUGGINGFACE_API_URL: 'https://api-inference.huggingface.co/models',

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
