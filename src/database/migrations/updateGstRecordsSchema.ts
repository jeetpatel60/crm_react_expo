import * as SQLite from 'expo-sqlite';

/**
 * Migration to update unit_gst_records table schema
 * - Remove amount and status columns
 * - Rename description to remarks
 */
export const updateGstRecordsSchema = async (getDatabase: () => SQLite.SQLiteDatabase): Promise<void> => {
  try {
    console.log('Running migration: Updating unit_gst_records table schema...');
    const db = getDatabase();

    // Check if the table exists
    const tableExists = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='unit_gst_records';"
    );

    if (!tableExists) {
      console.log('unit_gst_records table does not exist, skipping migration');
      return;
    }

    // Check current table structure
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(unit_gst_records);"
    );
    
    const hasAmountColumn = tableInfo.some((column: any) => column.name === 'amount');
    const hasStatusColumn = tableInfo.some((column: any) => column.name === 'status');
    const hasDescriptionColumn = tableInfo.some((column: any) => column.name === 'description');
    const hasRemarksColumn = tableInfo.some((column: any) => column.name === 'remarks');

    // If the table already has the new schema, skip migration
    if (!hasAmountColumn && !hasStatusColumn && !hasDescriptionColumn && hasRemarksColumn) {
      console.log('unit_gst_records table already has the updated schema');
      return;
    }

    console.log('Updating unit_gst_records table schema...');

    // SQLite doesn't support dropping columns directly, so we need to:
    // 1. Create a new table with the desired schema
    // 2. Copy data from old table to new table
    // 3. Drop old table
    // 4. Rename new table

    // Step 1: Create new table with updated schema
    await db.execAsync(`
      CREATE TABLE unit_gst_records_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        date INTEGER NOT NULL,
        remarks TEXT,
        r_amount REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (unit_id) REFERENCES units_flats (id) ON DELETE CASCADE
      );
    `);

    // Step 2: Copy data from old table to new table
    // Map description to remarks, keep other compatible fields
    await db.execAsync(`
      INSERT INTO unit_gst_records_new (
        id, unit_id, sr_no, date, remarks, r_amount, created_at, updated_at
      )
      SELECT 
        id, 
        unit_id, 
        sr_no, 
        date, 
        ${hasDescriptionColumn ? 'description' : 'NULL'} as remarks,
        r_amount, 
        created_at, 
        updated_at
      FROM unit_gst_records;
    `);

    // Step 3: Drop old table
    await db.execAsync('DROP TABLE unit_gst_records;');

    // Step 4: Rename new table
    await db.execAsync('ALTER TABLE unit_gst_records_new RENAME TO unit_gst_records;');

    console.log('Successfully updated unit_gst_records table schema');
  } catch (error) {
    console.error('Error in updateGstRecordsSchema migration:', error);
    throw error;
  }
};
