import { db } from './database';

export interface Company {
  id?: number;
  name: string;
  salutation?: string;
  letterhead_path?: string;
  created_at?: number;
  updated_at?: number;
}

// Get all companies
export const getCompanies = async (): Promise<Company[]> => {
  try {
    return await db.getAllAsync<Company>('SELECT * FROM companies ORDER BY name ASC;');
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

// Get a company by ID
export const getCompanyById = async (id: number): Promise<Company> => {
  try {
    const company = await db.getFirstAsync<Company>('SELECT * FROM companies WHERE id = ?;', id);
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

// Add a new company
export const addCompany = async (company: Company): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO companies (name, salutation, letterhead_path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?);`,
      [
        company.name,
        company.salutation || null,
        company.letterhead_path || null,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding company:', error);
    throw error;
  }
};

// Update a company
export const updateCompany = async (company: Company): Promise<void> => {
  if (!company.id) {
    throw new Error('Company ID is required');
  }

  try {
    const now = Date.now();

    await db.runAsync(
      `UPDATE companies
       SET name = ?, salutation = ?, letterhead_path = ?, updated_at = ?
       WHERE id = ?;`,
      [
        company.name,
        company.salutation || null,
        company.letterhead_path || null,
        now,
        company.id
      ]
    );
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

// Delete a company
export const deleteCompany = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM companies WHERE id = ?;', id);
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};
