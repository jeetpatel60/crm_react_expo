import * as SQLite from 'expo-sqlite';

/**
 * Migration to add gst_percentage column to units_flats table
 */
export const addGstPercentageToUnitsFlats = async (getDatabase: () => SQLite.SQLiteDatabase): Promise<void> => {
  try {
    console.log('Running migration: Adding gst_percentage column to units_flats table...');
    const db = getDatabase();

    // Check if gst_percentage column already exists
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(units_flats);"
    );
    
    const gstPercentageColumnExists = tableInfo.some(
      (column: any) => column.name === 'gst_percentage'
    );

    if (!gstPercentageColumnExists) {
      // Add the gst_percentage column
      await db.execAsync(`
        ALTER TABLE units_flats 
        ADD COLUMN gst_percentage REAL DEFAULT 0;
      `);
      console.log('Successfully added gst_percentage column to units_flats table');
    } else {
      console.log('gst_percentage column already exists in units_flats table');
    }

    console.log('Migration addGstPercentageToUnitsFlats completed successfully');
  } catch (error) {
    console.error('Error in addGstPercentageToUnitsFlats migration:', error);
    throw error;
  }
};
