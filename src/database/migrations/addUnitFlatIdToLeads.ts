import { SQLiteDatabase } from 'expo-sqlite';

export const addUnitFlatIdToLeads = async (getDatabase: () => SQLiteDatabase): Promise<void> => {
  try {
    const db = getDatabase();
    console.log('Running migration: addUnitFlatIdToLeads');

    // Check if the column already exists
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(leads);`);
    const columnExists = tableInfo.some((column: any) => column.name === 'unit_flat_id');

    if (!columnExists) {
      console.log('Adding unit_flat_id column to leads table...');
      await db.execAsync(`
        ALTER TABLE leads ADD COLUMN unit_flat_id INTEGER;
      `);
      
      // Add foreign key constraint (SQLite doesn't support adding foreign keys to existing tables,
      // so we'll just add the column for now)
      console.log('unit_flat_id column added to leads table successfully');
    } else {
      console.log('unit_flat_id column already exists in leads table');
    }
  } catch (error) {
    console.error('Error in addUnitFlatIdToLeads migration:', error);
    throw error;
  }
};
