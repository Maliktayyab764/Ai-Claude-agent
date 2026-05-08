import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'jobapply.db');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      gmail_connected INTEGER DEFAULT 0,
      gmail_tokens TEXT,
      resume_path TEXT,
      resume_text TEXT,
      skills TEXT,
      experience_years INTEGER,
      preferred_locations TEXT,
      preferred_job_types TEXT,
      preferred_roles TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS platform_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      platform_name TEXT NOT NULL,
      platform_url TEXT,
      username TEXT,
      email TEXT,
      password_encrypted TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      job_type TEXT,
      remote_type TEXT,
      description TEXT,
      requirements TEXT,
      salary_range TEXT,
      source_url TEXT,
      source_platform TEXT,
      match_score REAL DEFAULT 0,
      eligibility_score REAL DEFAULT 0,
      status TEXT DEFAULT 'discovered',
      company_research TEXT,
      tailored_resume TEXT,
      strategy_notes TEXT,
      applied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS application_timeline (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_description TEXT,
      agent_name TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agent_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      job_id TEXT,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      input_data TEXT,
      output_data TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_learnings (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      learning_type TEXT NOT NULL,
      content TEXT NOT NULL,
      confidence REAL DEFAULT 0.5,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS search_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      keywords TEXT,
      excluded_companies TEXT,
      min_salary INTEGER,
      max_commute_miles INTEGER,
      industries TEXT,
      company_sizes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('Database initialized successfully');
}

export default db;
