import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config.js';
import { fileQueries, userQueries } from '../models/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { generateFilename, ensureDirSync, getExtensionFromMime } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(config.UPLOADS_DIR, req.user.id);
    ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = getExtensionFromMime(file.mimetype);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (config.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Upload file
router.post('/upload', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400, 'NO_FILE');
  }

  const fileRecord = {
    id: uuidv4(),
    userId: req.user.id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storagePath: req.file.path
  };

  fileQueries.create(fileRecord);

  res.json({
    success: true,
    data: {
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        url: `/api/files/${fileRecord.id}`
      }
    }
  });
}));

// Get file
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const file = fileQueries.findById(req.params.id);

  if (!file) {
    throw new AppError('File not found', 404, 'NOT_FOUND');
  }

  if (file.user_id !== req.user.id) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  if (!existsSync(file.storage_path)) {
    throw new AppError('File not found on disk', 404, 'FILE_MISSING');
  }

  res.sendFile(file.storage_path);
}));

// Get user's files
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const files = fileQueries.findByUserId(req.user.id);

  res.json({
    success: true,
    data: {
      files: files.map(f => ({
        id: f.id,
        filename: f.filename,
        originalName: f.original_name,
        mimeType: f.mime_type,
        size: f.size,
        url: `/api/files/${f.id}`,
        createdAt: f.created_at
      }))
    }
  });
}));

// Delete file
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const file = fileQueries.findById(req.params.id);

  if (!file) {
    throw new AppError('File not found', 404, 'NOT_FOUND');
  }

  if (file.user_id !== req.user.id) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  // Delete from disk
  if (existsSync(file.storage_path)) {
    unlinkSync(file.storage_path);
  }

  // Delete from database
  fileQueries.delete(req.params.id);

  res.json({
    success: true,
    message: 'File deleted'
  });
}));

export default router;
