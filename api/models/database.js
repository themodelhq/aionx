import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLFromPath } from 'url';
import { dirname, join } from 'path';
import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';

const __filename = fileURLFromPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase() {
  // Ensure directories exist
  ensureDirSync(config.DATA_DIR);
  ensureDirSync(config.UPLOADS_DIR);

  const dbPath = join(config.DATA_DIR, 'aionx.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables();

  // Seed initial data if needed
  seedData();

  console.log('✓ Database initialized at:', dbPath);
  return db;
}

function createTables() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      is_premium INTEGER DEFAULT 0,
      credits INTEGER DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Generations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('image', 'video', 'audio', 'chat')),
      prompt TEXT,
      parameters TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      result_url TEXT,
      thumbnail_url TEXT,
      error_message TEXT,
      credits_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      mime_type TEXT,
      size INTEGER,
      storage_path TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Chat history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      attachments TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
    CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
  `);
}

function seedData() {
  // Check if demo user exists
  const demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@aionx.ai');

  if (!demoUser) {
    // Create demo user (password: demo123)
    const passwordHash = bcrypt.hashSync('demo123', 10);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, is_premium, credits)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'demo@aionx.ai',
      passwordHash,
      'Demo User',
      1, // Premium
      1000 // Lots of credits
    );

    console.log('✓ Demo user created: demo@aionx.ai / demo123');
  }
}

// Helper functions for database operations
export const userQueries = {
  findByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  create: (user) => {
    return db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, credits)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.email, user.passwordHash, user.displayName, user.credits || config.INITIAL_CREDITS);
  },

  update: (id, updates) => {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    return db.prepare(`UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  },

  updateCredits: (id, amount) => {
    return db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(amount, id);
  }
};

export const sessionQueries = {
  create: (session) => {
    return db.prepare(`
      INSERT INTO sessions (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(session.id, session.userId, session.tokenHash, session.expiresAt);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  },

  findValidByTokenHash: (tokenHash) => {
    return db.prepare(`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now')
    `).get(tokenHash);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  },

  deleteByUserId: (userId) => {
    return db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  },

  deleteExpired: () => {
    return db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  }
};

export const generationQueries = {
  create: (gen) => {
    return db.prepare(`
      INSERT INTO generations (id, user_id, type, prompt, parameters, status, credits_used)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(gen.id, gen.userId, gen.type, gen.prompt, JSON.stringify(gen.parameters), gen.status, gen.creditsUsed);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM generations WHERE id = ?').get(id);
  },

  findByUserId: (userId, limit = 50, offset = 0) => {
    return db.prepare(`
      SELECT * FROM generations
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);
  },

  findByUserIdAndType: (userId, type, limit = 50, offset = 0) => {
    return db.prepare(`
      SELECT * FROM generations
      WHERE user_id = ? AND type = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, type, limit, offset);
  },

  update: (id, updates) => {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    if (updates.status === 'completed') {
      return db.prepare(`UPDATE generations SET ${fields}, completed_at = datetime('now') WHERE id = ?`).run(...values, id);
    }
    return db.prepare(`UPDATE generations SET ${fields} WHERE id = ?`).run(...values, id);
  },

  countByUserId: (userId) => {
    return db.prepare('SELECT COUNT(*) as count FROM generations WHERE user_id = ?').get(userId);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM generations WHERE id = ?').run(id);
  }
};

export const chatQueries = {
  create: (message) => {
    return db.prepare(`
      INSERT INTO chat_messages (id, user_id, session_id, role, content, attachments)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(message.id, message.userId, message.sessionId, message.role, message.content, JSON.stringify(message.attachments || []));
  },

  findByUserId: (userId, sessionId = null, limit = 50) => {
    if (sessionId) {
      return db.prepare(`
        SELECT * FROM chat_messages
        WHERE user_id = ? AND session_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(userId, sessionId, limit);
    }
    return db.prepare(`
      SELECT * FROM chat_messages
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
  },

  getHistory: (userId, sessionId, limit = 20) => {
    return db.prepare(`
      SELECT * FROM chat_messages
      WHERE user_id = ? AND session_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `).all(userId, sessionId, limit);
  }
};

export const fileQueries = {
  create: (file) => {
    return db.prepare(`
      INSERT INTO files (id, user_id, filename, original_name, mime_type, size, storage_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(file.id, file.userId, file.filename, file.originalName, file.mimeType, file.size, file.storagePath);
  },

  findById: (id) => {
    return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
  },

  findByUserId: (userId) => {
    return db.prepare('SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM files WHERE id = ?').run(id);
  }
};

export default {
  getDatabase,
  initDatabase,
  userQueries,
  sessionQueries,
  generationQueries,
  chatQueries,
  fileQueries
};
