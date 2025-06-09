import * as SQLite from 'expo-sqlite';

/**
 * Migration to add gst_amount column to units_flats table
 */
export const addGstAmountToUnitsFlats = async (getDatabase: () => SQLite.SQLiteDatabase): Promise<void> => {
  try {
    console.log('Running migration: Adding gst_amount column to units_flats table...');
    const db = getDatabase();

    // Check if gst_amount column already exists
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(units_flats);"
    );
    
    const gstAmountColumnExists = tableInfo.some(
      (column: any) => column.name === 'gst_amount'
    );

    if (!gstAmountColumnExists) {
      // Add the gst_amount column
      await db.execAsync(`
        ALTER TABLE units_flats 
        ADD COLUMN gst_amount REAL DEFAULT 0;
      `);
      console.log('Successfully added gst_amount column to units_flats table');
    } else {
      console.log('gst_amount column already exists in units_flats table');
    }

    console.log('Migration addGstAmountToUnitsFlats completed successfully');
  } catch (error) {
    console.error('Error in addGstAmountToUnitsFlats migration:', error);
    throw error;
  }
};
