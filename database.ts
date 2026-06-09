import pg from 'pg';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const { Pool } = pg;

// Unified database wrapper interface to match both pg and sqlite operations
export interface DBWrapper {
  run(sql: string, params?: any[]): Promise<{ lastID?: number }>;
  get(sql: string, params?: any[]): Promise<any | undefined>;
  all(sql: string, params?: any[]): Promise<any[]>;
  exec(sql: string): Promise<any>;
}

let activeDb: DBWrapper | null = null;

export async function getDb(): Promise<DBWrapper> {
  if (activeDb) {
    return activeDb;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log("DATABASE_URL missing, using local SQLite for development.");
    
    try {
      const sqliteDb = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
      });
      
      // Enable Foreign Keys in SQLite
      await sqliteDb.exec("PRAGMA foreign_keys = ON;");

      // Initialize SQLite schema
      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password TEXT
        );
      `);

      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT,
          content TEXT,
          summary TEXT,
          key_points TEXT,
          action_items TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS chunks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          doc_id INTEGER,
          text TEXT,
          embedding TEXT, -- JSON string array of numbers
          FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
        );
      `);

      await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS chat_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          doc_id INTEGER,
          role TEXT, -- 'user' or 'assistant'
          message TEXT,
          sources TEXT, -- JSON string array
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
        );
      `);

      // Performance index optimization for database persistence
      await sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);`);
      await sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks(doc_id);`);
      await sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_chat_history_doc_id ON chat_history(doc_id);`);

      console.log("SQLite schema and indexes verified/initialized successfully.");
      activeDb = getSqliteWrapper(sqliteDb);
      return activeDb;
    } catch (sqliteErr) {
      console.error("Failed to initialize SQLite database fallback:", sqliteErr);
      throw sqliteErr;
    }
  }

  // If DATABASE_URL is present, connect to PostgreSQL
  console.log(`Connecting to PostgreSQL database using connection string length: ${connectionString.length}`);
  
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Verify connection
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connection verified successfully.");
    client.release();
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err);
    throw err;
  }

  // Initialize postgres database schemas
  console.log("Initializing database schema in PostgreSQL...");
  const setupClient = await pool.connect();
  try {
    await setupClient.query("BEGIN;");
    
    await setupClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT
      );
    `);
    
    await setupClient.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name TEXT,
        content TEXT,
        summary TEXT,
        key_points TEXT,
        action_items TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await setupClient.query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        doc_id INTEGER,
        text TEXT,
        embedding TEXT, -- JSON string array
        FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
      );
    `);

    await setupClient.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        doc_id INTEGER,
        role TEXT, -- 'user' or 'assistant'
        message TEXT,
        sources TEXT, -- JSON string array
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE
      );
    `);

    // Add indexes for speedy query execution on large databases
    await setupClient.query(`CREATE INDEX IF NOT EXISTS idx_pg_documents_user_id ON documents(user_id);`);
    await setupClient.query(`CREATE INDEX IF NOT EXISTS idx_pg_chunks_doc_id ON chunks(doc_id);`);
    await setupClient.query(`CREATE INDEX IF NOT EXISTS idx_pg_chat_history_doc_id ON chat_history(doc_id);`);
    
    await setupClient.query("COMMIT;");
    console.log("PostgreSQL database migrations executed successfully with system indexes.");
  } catch (schemaErr) {
    await setupClient.query("ROLLBACK;");
    console.error("Error setting up database schema in PostgreSQL:", schemaErr);
    throw schemaErr;
  } finally {
    setupClient.release();
  }

  activeDb = getPgWrapper(pool);
  return activeDb;
}

function getPgWrapper(p: pg.Pool): DBWrapper {
  return {
    async run(sql: string, params: any[] = []): Promise<{ lastID?: number }> {
      let pgSql = sql;
      const isInsert = sql.trim().toUpperCase().startsWith("INSERT");
      if (isInsert && !sql.toUpperCase().includes("RETURNING")) {
        pgSql = sql.trim() + " RETURNING id";
      }
      
      let counter = 1;
      const pgSqlFormatted = pgSql.replace(/\?/g, () => `$${counter++}`);
      
      const res = await p.query(pgSqlFormatted, params);
      if (isInsert && res.rows.length > 0) {
        return { lastID: res.rows[0].id };
      }
      return {};
    },

    async get(sql: string, params: any[] = []): Promise<any | undefined> {
      let counter = 1;
      const pgSqlFormatted = sql.replace(/\?/g, () => `$${counter++}`);
      const res = await p.query(pgSqlFormatted, params);
      return res.rows[0];
    },

    async all(sql: string, params: any[] = []): Promise<any[]> {
      let counter = 1;
      const pgSqlFormatted = sql.replace(/\?/g, () => `$${counter++}`);
      const res = await p.query(pgSqlFormatted, params);
      return res.rows;
    },

    async exec(sql: string): Promise<any> {
      return p.query(sql);
    }
  };
}

function getSqliteWrapper(sDb: any): DBWrapper {
  return {
    async run(sql: string, params: any[] = []): Promise<{ lastID?: number }> {
      const res = await sDb.run(sql, params);
      return { lastID: res.lastID };
    },

    async get(sql: string, params: any[] = []): Promise<any | undefined> {
      return sDb.get(sql, params);
    },

    async all(sql: string, params: any[] = []): Promise<any[]> {
      return sDb.all(sql, params);
    },

    async exec(sql: string): Promise<any> {
      return sDb.exec(sql);
    }
  };
}
