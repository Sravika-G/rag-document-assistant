import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Initialize tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      content TEXT,
      summary TEXT,
      key_points TEXT,
      action_items TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER,
      text TEXT,
      embedding TEXT, -- JSON string array
      FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER,
      role TEXT, -- 'user' or 'assistant'
      message TEXT,
      sources TEXT, -- JSON string array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  return db;
}
