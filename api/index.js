import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase } from './models/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import generationRoutes from './routes/generations.js';
import fileRoutes from './routes/files.js';
import chatRoutes from './routes/chat.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Stricter for auth endpoints
  message: { error: 'Too many authentication attempts, please try again later.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static files for uploads
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Initialize database
initDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/generations', generationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve frontend in production (only if public folder exists)
import { existsSync } from 'fs';
const publicPath = join(__dirname, '../public');
if (existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// SPA fallback - only serve index.html if it exists, otherwise return API info
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return;
  const indexPath = join(publicPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ status: 'AionX API is running', docs: '/api/health' });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     █████╗ ██╗██████╗ ███████╗██╗   ██╗██████╗ ███████╗   ║
║    ██╔══██╗██║██╔══██╗██╔════╝██║   ██║██╔══██╗██╔════╝   ║
║    ███████║██║██████╔╝███████╗██║   ██║██████╔╝█████╗     ║
║    ██╔══██║██║██╔══██╗╚════██║██║   ██║██╔══██╗██╔══╝     ║
║    ██║  ██║██║██║  ██║███████║╚██████╔╝██║  ██║███████╗   ║
║    ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ║
║                                                           ║
║    Next Generation AI Creative Platform                    ║
║    Server running on port ${PORT}                            ║
║                                                           ║
║    Groq (Chat):     ${config.GROQ_API_KEY ? '✓ Connected' : '✗ No key set  '}                     ║
║    Gemini (Image):  ${config.GEMINI_API_KEY ? '✓ Connected' : '✗ No key set  '}                     ║
║    Gemini (Audio):  ${config.GEMINI_API_KEY ? '✓ Connected' : '✗ No key set  '}                     ║
║    Magic Hour:      ${config.MAGIC_HOUR_API_KEY ? '✓ Connected' : '✗ No key set  '}                     ║
║    Tavus:           ${config.TAVUS_API_KEY ? '✓ Connected' : '✗ No key set  '}                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
