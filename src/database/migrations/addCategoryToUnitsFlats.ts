import { SQLiteDatabase } from 'expo-sqlite';

export const addCategoryToUnitsFlats = async (getDatabase: () => SQLiteDatabase): Promise<void> => {
  try {
    const db = getDatabase();
    
    // Check if category column already exists
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(units_flats);`);
    const categoryColumnExists = tableInfo.some((column: any) => column.name === 'category');
    
    if (!categoryColumnExists) {
      console.log('Adding category column to units_flats table...');
      await db.execAsync(`
        ALTER TABLE units_flats ADD COLUMN category TEXT;
      `);
      console.log('Category column added to units_flats table successfully');
    } else {
      console.log('Category column already exists in units_flats table');
    }
  } catch (error) {
    console.error('Error adding category column to units_flats table:', error);
    throw error;
  }
};
