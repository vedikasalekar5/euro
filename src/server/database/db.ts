import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target database file path
const DB_FILE_PATH = path.resolve(process.cwd(), 'euro_unit_test.db');

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let isInitialized = false;

/**
 * Initializes SQLite database connection with "euro_unit_test.db"
 */
export async function getDb(): Promise<Database> {
  if (dbInstance && isInitialized) {
    return dbInstance;
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Load existing database file from disk if it exists
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Could not read existing euro_unit_test.db, creating fresh database instance:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Create tables and indexes
  initSchema(dbInstance);

  isInitialized = true;
  saveDbToDisk();

  return dbInstance;
}

/**
 * Commits the in-memory SQLite database state to euro_unit_test.db on disk
 */
export function saveDbToDisk(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error saving euro_unit_test.db to disk:', err);
  }
}

/**
 * Creates all required relational tables and indexes
 */
function initSchema(db: Database): void {
  // 1. Create base tables if they don't exist
  const baseTablesSQL = `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT,
      roll_number TEXT NOT NULL,
      student_name TEXT NOT NULL,
      enrollment_number TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      division TEXT DEFAULT 'A',
      gender TEXT DEFAULT 'Other',
      email TEXT,
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      position TEXT DEFAULT 'Faculty',
      department TEXT NOT NULL,
      subject TEXT,
      course_code TEXT,
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      teacher_id TEXT,
      unit_1_max_marks REAL DEFAULT 30,
      unit_2_max_marks REAL DEFAULT 30,
      created_at TEXT NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS marks (
      id TEXT PRIMARY KEY,
      teacher_id TEXT,
      student_id INTEGER NOT NULL,
      subject_id TEXT NOT NULL,
      unit_test_1_marks REAL DEFAULT 0,
      unit_test_1_max_marks REAL DEFAULT 30,
      unit_test_2_marks REAL DEFAULT 0,
      unit_test_2_max_marks REAL DEFAULT 30,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE(student_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      teacher_id TEXT,
      teacher_name TEXT,
      student_id TEXT,
      student_name TEXT,
      roll_number TEXT,
      subject_id TEXT,
      subject_name TEXT,
      course_title TEXT,
      course_code TEXT,
      programming_name TEXT,
      exam_type TEXT,
      unit TEXT,
      old_marks TEXT,
      new_marks TEXT,
      action TEXT,
      description TEXT,
      changed_by TEXT
    );
  `;

  db.exec(baseTablesSQL);

  // 2. Safely ensure all columns exist across all existing and new tables
  const ensureColumn = (tableName: string, colName: string, colDef: string) => {
    try {
      const stmt = db.prepare(`PRAGMA table_info(${tableName})`);
      const cols: string[] = [];
      while (stmt.step()) {
        const obj = stmt.getAsObject() as { name: string };
        if (obj && obj.name) cols.push(obj.name.toLowerCase());
      }
      stmt.free();
      if (!cols.includes(colName.toLowerCase())) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colDef};`);
      }
    } catch (err) {
      console.warn(`Migration notice for ${tableName}.${colName}:`, err);
    }
  };

  ensureColumn('students', 'teacher_id', 'TEXT');
  ensureColumn('students', 'division', "TEXT DEFAULT 'A'");
  ensureColumn('students', 'gender', "TEXT DEFAULT 'Other'");
  ensureColumn('students', 'email', 'TEXT');
  ensureColumn('students', 'phone', 'TEXT');

  ensureColumn('subjects', 'teacher_id', 'TEXT');
  ensureColumn('subjects', 'unit_1_max_marks', 'REAL DEFAULT 30');
  ensureColumn('subjects', 'unit_2_max_marks', 'REAL DEFAULT 30');

  ensureColumn('marks', 'teacher_id', 'TEXT');
  ensureColumn('marks', 'unit_test_1_max_marks', 'REAL DEFAULT 30');
  ensureColumn('marks', 'unit_test_2_max_marks', 'REAL DEFAULT 30');

  ensureColumn('audit_logs', 'teacher_id', 'TEXT');
  ensureColumn('audit_logs', 'teacher_name', 'TEXT');
  ensureColumn('audit_logs', 'course_title', 'TEXT');
  ensureColumn('audit_logs', 'course_code', 'TEXT');
  ensureColumn('audit_logs', 'programming_name', 'TEXT');

  // 3. Create all performance indexes after ensuring columns exist
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
      CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_number);
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(student_name);
      CREATE INDEX IF NOT EXISTS idx_students_dept_year ON students(department, year);
      CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON subjects(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_subjects_dept_year ON subjects(department, year);
      CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
      CREATE INDEX IF NOT EXISTS idx_marks_subject ON marks(subject_id);
      CREATE INDEX IF NOT EXISTS idx_audit_teacher ON audit_logs(teacher_id);
    `);
  } catch (idxErr) {
    console.warn('Index creation warning:', idxErr);
  }
}

/**
 * Execute parameterized query returning array of rows as objects
 */
export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

/**
 * Execute parameterized query returning single row object or null
 */
export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

let inTransaction = false;

/**
 * Checks if a transaction is currently in progress
 */
export function isTransactionActive(): boolean {
  return inTransaction;
}

/**
 * Safely begins a database transaction if one is not already active
 */
export function beginTransaction(): boolean {
  if (!dbInstance) throw new Error('Database not initialized');
  if (inTransaction) {
    return false; // Already inside a transaction, do not nest
  }
  try {
    dbInstance.exec('BEGIN TRANSACTION;');
    inTransaction = true;
    return true;
  } catch (err: any) {
    console.error('Failed to begin transaction:', err);
    inTransaction = false;
    throw err;
  }
}

/**
 * Safely commits the active transaction and persists to disk
 */
export function commitTransaction(): boolean {
  if (!dbInstance) throw new Error('Database not initialized');
  if (!inTransaction) {
    console.warn('commitTransaction called but no transaction was active.');
    return false;
  }
  try {
    dbInstance.exec('COMMIT;');
    inTransaction = false;
    saveDbToDisk();
    return true;
  } catch (err: any) {
    console.error('Failed to commit transaction:', err);
    inTransaction = false;
    throw err;
  }
}

/**
 * Safely rolls back the active transaction
 */
export function rollbackTransaction(): boolean {
  if (!dbInstance) return false;
  if (!inTransaction) {
    return false;
  }
  try {
    dbInstance.exec('ROLLBACK;');
    inTransaction = false;
    return true;
  } catch (err: any) {
    console.warn('Rollback warning (transaction might have auto-rolled back):', err?.message || err);
    inTransaction = false;
    return false;
  }
}

/**
 * Execute parameterized command (INSERT/UPDATE/DELETE)
 */
export function run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  
  // Only sync to disk immediately if not inside a batch transaction
  if (!inTransaction) {
    saveDbToDisk();
  }

  const info = queryOne<{ changes: number; last_id: number }>(
    'SELECT changes() as changes, last_insert_rowid() as last_id'
  );

  return {
    changes: info?.changes || 0,
    lastInsertRowid: info?.last_id || 0,
  };
}

/**
 * Execute arbitrary SQL script or command
 */
export function exec(sql: string): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.exec(sql);
  if (!inTransaction) {
    saveDbToDisk();
  }
}

/**
 * Execute commands in a transactional wrapper with auto commit and rollback on error
 */
export function withTransaction<T>(fn: () => T): T {
  if (!dbInstance) throw new Error('Database not initialized');
  
  // If already inside an outer transaction, execute fn without nested BEGIN/COMMIT
  if (inTransaction) {
    return fn();
  }

  beginTransaction();
  try {
    const result = fn();
    commitTransaction();
    return result;
  } catch (err) {
    rollbackTransaction();
    throw err;
  }
}
