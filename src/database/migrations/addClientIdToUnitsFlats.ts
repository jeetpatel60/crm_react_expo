import * as SQLite from 'expo-sqlite';

/**
 * Migration to add client_id column to units_flats table
 */
export const addClientIdToUnitsFlats = async (getDatabase: () => SQLite.SQLiteDatabase): Promise<void> => {
  try {
    console.log('Running migration: Adding client_id column to units_flats table...');
    const db = getDatabase();

    // Check if client_id column already exists
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(units_flats);"
    );
    
    const clientIdColumnExists = tableInfo.some(
      (column: any) => column.name === 'client_id'
    );

    if (!clientIdColumnExists) {
      // Add the client_id column
      await db.execAsync(`
        ALTER TABLE units_flats 
        ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
      `);
      console.log('Successfully added client_id column to units_flats table');
    } else {
      console.log('client_id column already exists in units_flats table');
    }
  } catch (error) {
    console.error('Error adding client_id column to units_flats table:', error);
    throw error;
  }
};
