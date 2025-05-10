import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Define the database type
export type DatabaseType = SQLite.SQLiteDatabase;

// Database instance - will be initialized during app startup
let database: DatabaseType | null = null;

/**
 * Initialize the database connection
 * Returns true if database was successfully initialized
 */
export const initializeDb = async (): Promise<boolean> => {
  try {
    console.log('Initializing database connection...');

    if (Platform.OS === 'web') {
      throw new Error('SQLite is not supported on web platform');
    }

    database = await SQLite.openDatabaseAsync('crm.db');
    console.log('SUCCESS: Using SQLite database');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Export the database getter function
// This ensures we have a safe way to access the database
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDb() first.');
  }
  return database;
};

// For backward compatibility with existing code
// We create a simpler wrapper around the database
export const db = {
  execAsync: async (sql: string): Promise<void> => {
    return getDatabase().execAsync(sql);
  },

  runAsync: async (sql: string, ...params: any[]): Promise<{ lastInsertRowId: number, changes: number }> => {
    return getDatabase().runAsync(sql, ...params);
  },

  getFirstAsync: async <T = any>(sql: string, ...params: any[]): Promise<T | null> => {
    return getDatabase().getFirstAsync<T>(sql, ...params);
  },

  getAllAsync: async <T = any>(sql: string, ...params: any[]): Promise<T[]> => {
    return getDatabase().getAllAsync<T>(sql, ...params);
  },

  withTransactionAsync: async (callback: () => Promise<void>): Promise<void> => {
    return getDatabase().withTransactionAsync(callback);
  }
} as unknown as SQLite.SQLiteDatabase;

// Initialize the database schema
export const initDatabase = async (): Promise<void> => {
  try {
    console.log('Creating database tables...');

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Enable WAL mode for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create contacts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create tasks table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        due_date INTEGER,
        status TEXT NOT NULL,
        contact_id INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      );
    `);

    // Create companies table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        salutation TEXT,
        letterhead_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create clients table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        pan_no TEXT,
        gstin_no TEXT,
        contact_no TEXT,
        email TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create leads table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        enquiry_for TEXT,
        budget REAL,
        reference TEXT,
        lead_source TEXT,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
};
