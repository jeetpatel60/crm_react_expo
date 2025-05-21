import * as SQLite from 'expo-sqlite';

/**
 * Migration to add templates tables
 */
export const addTemplatesTables = async (getDatabase: () => SQLite.SQLiteDatabase): Promise<void> => {
  try {
    console.log('Creating templates tables...');
    const db = getDatabase();

    // Create agreement_templates table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS agreement_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create payment_request_templates table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payment_request_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    console.log('Templates tables created successfully');
  } catch (error) {
    console.error('Error creating templates tables:', error);
    throw error;
  }
};
