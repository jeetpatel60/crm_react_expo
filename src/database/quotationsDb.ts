import { db } from './database';
import { updateQuotationTotalAmount } from './quotationHelpers';

export interface Quotation {
  id?: number;
  quotation_no: string;
  date: number; // timestamp
  project_id?: number;
  lead_id?: number;
  flat_id?: number;
  company_id?: number;
  total_amount?: number;
  created_at?: number;
  updated_at?: number;
}

// Get all quotations
export const getQuotations = async (): Promise<Quotation[]> => {
  try {
    return await db.getAllAsync<Quotation>('SELECT * FROM quotations ORDER BY date DESC;');
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};

// Get quotation by ID
export const getQuotationById = async (id: number): Promise<Quotation | null> => {
  try {
    return await db.getFirstAsync<Quotation>(
      'SELECT * FROM quotations WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching quotation with ID ${id}:`, error);
    throw error;
  }
};

// Add a new quotation
export const addQuotation = async (quotation: Quotation): Promise<number> => {
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO quotations (
        quotation_no, date, project_id, lead_id, flat_id, company_id, 
        total_amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      quotation.quotation_no,
      quotation.date,
      quotation.project_id || null,
      quotation.lead_id || null,
      quotation.flat_id || null,
      quotation.company_id || null,
      quotation.total_amount || 0,
      now,
      now
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding quotation:', error);
    throw error;
  }
};

// Update an existing quotation
export const updateQuotation = async (quotation: Quotation): Promise<void> => {
  try {
    if (!quotation.id) {
      throw new Error('Quotation ID is required for update');
    }

    const now = Date.now();
    await db.runAsync(
      `UPDATE quotations SET 
        quotation_no = ?, 
        date = ?, 
        project_id = ?, 
        lead_id = ?, 
        flat_id = ?, 
        company_id = ?, 
        total_amount = ?,
        updated_at = ? 
      WHERE id = ?;`,
      quotation.quotation_no,
      quotation.date,
      quotation.project_id || null,
      quotation.lead_id || null,
      quotation.flat_id || null,
      quotation.company_id || null,
      quotation.total_amount || 0,
      now,
      quotation.id
    );
  } catch (error) {
    console.error(`Error updating quotation with ID ${quotation.id}:`, error);
    throw error;
  }
};

// Delete a quotation
export const deleteQuotation = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM quotations WHERE id = ?;', id);
  } catch (error) {
    console.error(`Error deleting quotation with ID ${id}:`, error);
    throw error;
  }
};

// Get the next available quotation number
export const getNextQuotationNumber = async (): Promise<string> => {
  try {
    const result = await db.getFirstAsync<{ max_num: number }>(
      'SELECT MAX(CAST(REPLACE(quotation_no, "QT", "") AS INTEGER)) as max_num FROM quotations WHERE quotation_no LIKE "QT%";'
    );
    
    const nextNum = result && result.max_num ? result.max_num + 1 : 1;
    return `QT${nextNum.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating next quotation number:', error);
    return `QT${Date.now().toString().slice(-4)}`;
  }
};
