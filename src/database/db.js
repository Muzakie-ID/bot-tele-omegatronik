const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

/**
 * Database handler menggunakan SQLite
 */
class DatabaseHandler {
  
  constructor() {
    this.db = null;
    this.init();
  }
  
  /**
   * Initialize database
   */
  init() {
    try {
      // Pastikan folder database ada
      const dbDir = path.dirname(config.database.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Connect to database
      this.db = new Database(config.database.path);
      
      // Create tables
      this.createTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }
  
  /**
   * Create tables
   */
  createTables() {
    // Table untuk users
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        is_admin INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Table untuk transactions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ref_id TEXT UNIQUE NOT NULL,
        product_code TEXT NOT NULL,
        product_name TEXT,
        destination TEXT NOT NULL,
        amount INTEGER,
        status TEXT DEFAULT 'PENDING',
        sn TEXT,
        message TEXT,
        request_data TEXT,
        response_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Table untuk sessions (untuk menyimpan state user)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        state TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_ref_id ON transactions(ref_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_telegram_id ON sessions(telegram_id);
    `);
  }
  
  /**
   * Get or create user
   */
  getOrCreateUser(telegramUser) {
    const existing = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramUser.id);
    
    if (existing) {
      // Update user info
      this.db.prepare(`
        UPDATE users 
        SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE telegram_id = ?
      `).run(telegramUser.username || null, telegramUser.first_name || null, telegramUser.last_name || null, telegramUser.id);
      
      return existing;
    }
    
    // Create new user
    const result = this.db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name)
      VALUES (?, ?, ?, ?)
    `).run(telegramUser.id, telegramUser.username || null, telegramUser.first_name || null, telegramUser.last_name || null);
    
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }
  
  /**
   * Save transaction
   */
  saveTransaction(data) {
    const result = this.db.prepare(`
      INSERT INTO transactions (user_id, ref_id, product_code, product_name, destination, amount, status, sn, message, request_data, response_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.user_id,
      data.ref_id,
      data.product_code,
      data.product_name || null,
      data.destination,
      data.amount || null,
      data.status || 'PENDING',
      data.sn || null,
      data.message || null,
      data.request_data ? JSON.stringify(data.request_data) : null,
      data.response_data ? JSON.stringify(data.response_data) : null
    );
    
    return result.lastInsertRowid;
  }
  
  /**
   * Update transaction
   */
  updateTransaction(refId, updates) {
    const fields = [];
    const values = [];
    
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.sn) {
      fields.push('sn = ?');
      values.push(updates.sn);
    }
    if (updates.message) {
      fields.push('message = ?');
      values.push(updates.message);
    }
    if (updates.response_data) {
      fields.push('response_data = ?');
      values.push(JSON.stringify(updates.response_data));
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(refId);
    
    this.db.prepare(`
      UPDATE transactions SET ${fields.join(', ')} WHERE ref_id = ?
    `).run(...values);
  }
  
  /**
   * Get user transactions
   */
  getUserTransactions(userId, limit = 10) {
    return this.db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit);
  }
  
  /**
   * Get transaction by ref_id
   */
  getTransaction(refId) {
    return this.db.prepare('SELECT * FROM transactions WHERE ref_id = ?').get(refId);
  }
  
  /**
   * Save session
   */
  saveSession(telegramId, state, data = {}) {
    const existing = this.db.prepare('SELECT * FROM sessions WHERE telegram_id = ?').get(telegramId);
    
    if (existing) {
      this.db.prepare(`
        UPDATE sessions 
        SET state = ?, data = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE telegram_id = ?
      `).run(state, JSON.stringify(data), telegramId);
    } else {
      this.db.prepare(`
        INSERT INTO sessions (telegram_id, state, data)
        VALUES (?, ?, ?)
      `).run(telegramId, state, JSON.stringify(data));
    }
  }
  
  /**
   * Get session
   */
  getSession(telegramId) {
    const session = this.db.prepare('SELECT * FROM sessions WHERE telegram_id = ?').get(telegramId);
    
    if (session && session.data) {
      session.data = JSON.parse(session.data);
    }
    
    return session;
  }
  
  /**
   * Clear session
   */
  clearSession(telegramId) {
    this.db.prepare('DELETE FROM sessions WHERE telegram_id = ?').run(telegramId);
  }
  
  /**
   * Check if user is admin
   */
  isAdmin(telegramId) {
    const user = this.db.prepare('SELECT is_admin FROM users WHERE telegram_id = ?').get(telegramId);
    return user && user.is_admin === 1;
  }
  
  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseHandler();
