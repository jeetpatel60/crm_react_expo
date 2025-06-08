import * as SQLite from 'expo-sqlite';

/**
 * Migration to add b_value and w_value columns to units_flats table
 */
export const addBValueWValueToUnitsFlats = async (getDatabase: () => SQLite.SQLiteDatabase): Promise<void> => {
  try {
    console.log('Running migration: Adding b_value and w_value columns to units_flats table...');
    const db = getDatabase();

    // Check if b_value column already exists
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(units_flats);"
    );
    
    const bValueColumnExists = tableInfo.some(
      (column: any) => column.name === 'b_value'
    );
    
    const wValueColumnExists = tableInfo.some(
      (column: any) => column.name === 'w_value'
    );

    if (!bValueColumnExists) {
      // Add the b_value column
      await db.execAsync(`
        ALTER TABLE units_flats 
        ADD COLUMN b_value REAL DEFAULT 0;
      `);
      console.log('Successfully added b_value column to units_flats table');
    } else {
      console.log('b_value column already exists in units_flats table');
    }

    if (!wValueColumnExists) {
      // Add the w_value column
      await db.execAsync(`
        ALTER TABLE units_flats 
        ADD COLUMN w_value REAL DEFAULT 0;
      `);
      console.log('Successfully added w_value column to units_flats table');
    } else {
      console.log('w_value column already exists in units_flats table');
    }
  } catch (error) {
    console.error('Error adding b_value and w_value columns to units_flats table:', error);
    throw error;
  }
};
