import { db } from '../database';

/**
 * Migration to add company_id column to projects table
 */
export const addCompanyIdToProjects = async (): Promise<void> => {
  try {
    console.log('Running migration: Adding company_id column to projects table...');

    // Check if company_id column already exists
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(projects);"
    );
    
    const companyIdColumnExists = tableInfo.some(
      (column: any) => column.name === 'company_id'
    );

    if (!companyIdColumnExists) {
      // Add the company_id column
      await db.execAsync(`
        ALTER TABLE projects 
        ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;
      `);
      console.log('Successfully added company_id column to projects table');
    } else {
      console.log('company_id column already exists in projects table');
    }
  } catch (error) {
    console.error('Error adding company_id column to projects table:', error);
    throw error;
  }
};
