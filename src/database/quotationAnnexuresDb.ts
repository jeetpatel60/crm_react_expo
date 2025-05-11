import { db } from './database';
import { updateQuotationTotalAmount } from './quotationHelpers';

export interface QuotationAnnexureItem {
  id?: number;
  quotation_id: number;
  sr_no: number;
  description: string;
  amount: number;
  created_at?: number;
  updated_at?: number;
}

// Get all annexure A items for a quotation
export const getQuotationAnnexureA = async (quotationId: number): Promise<QuotationAnnexureItem[]> => {
  try {
    return await db.getAllAsync<QuotationAnnexureItem>(
      'SELECT * FROM quotation_annexure_a WHERE quotation_id = ? ORDER BY sr_no ASC;',
      quotationId
    );
  } catch (error) {
    console.error(`Error fetching annexure A items for quotation ID ${quotationId}:`, error);
    throw error;
  }
};

// Get all annexure B items for a quotation
export const getQuotationAnnexureB = async (quotationId: number): Promise<QuotationAnnexureItem[]> => {
  try {
    return await db.getAllAsync<QuotationAnnexureItem>(
      'SELECT * FROM quotation_annexure_b WHERE quotation_id = ? ORDER BY sr_no ASC;',
      quotationId
    );
  } catch (error) {
    console.error(`Error fetching annexure B items for quotation ID ${quotationId}:`, error);
    throw error;
  }
};

// Get all annexure C items for a quotation
export const getQuotationAnnexureC = async (quotationId: number): Promise<QuotationAnnexureItem[]> => {
  try {
    return await db.getAllAsync<QuotationAnnexureItem>(
      'SELECT * FROM quotation_annexure_c WHERE quotation_id = ? ORDER BY sr_no ASC;',
      quotationId
    );
  } catch (error) {
    console.error(`Error fetching annexure C items for quotation ID ${quotationId}:`, error);
    throw error;
  }
};

// Add a new annexure A item
export const addQuotationAnnexureA = async (item: QuotationAnnexureItem): Promise<number> => {
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO quotation_annexure_a (
        quotation_id, sr_no, description, amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      item.quotation_id,
      item.sr_no,
      item.description,
      item.amount,
      now,
      now
    );

    await updateQuotationTotalAmount(item.quotation_id);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding annexure A item:', error);
    throw error;
  }
};

// Add a new annexure B item
export const addQuotationAnnexureB = async (item: QuotationAnnexureItem): Promise<number> => {
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO quotation_annexure_b (
        quotation_id, sr_no, description, amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      item.quotation_id,
      item.sr_no,
      item.description,
      item.amount,
      now,
      now
    );

    await updateQuotationTotalAmount(item.quotation_id);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding annexure B item:', error);
    throw error;
  }
};

// Add a new annexure C item
export const addQuotationAnnexureC = async (item: QuotationAnnexureItem): Promise<number> => {
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO quotation_annexure_c (
        quotation_id, sr_no, description, amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      item.quotation_id,
      item.sr_no,
      item.description,
      item.amount,
      now,
      now
    );

    await updateQuotationTotalAmount(item.quotation_id);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding annexure C item:', error);
    throw error;
  }
};

// Update an annexure A item
export const updateQuotationAnnexureA = async (item: QuotationAnnexureItem): Promise<void> => {
  try {
    if (!item.id) {
      throw new Error('Annexure item ID is required for update');
    }

    const now = Date.now();
    await db.runAsync(
      `UPDATE quotation_annexure_a SET 
        sr_no = ?, 
        description = ?, 
        amount = ?,
        updated_at = ? 
      WHERE id = ?;`,
      item.sr_no,
      item.description,
      item.amount,
      now,
      item.id
    );

    await updateQuotationTotalAmount(item.quotation_id);
  } catch (error) {
    console.error(`Error updating annexure A item with ID ${item.id}:`, error);
    throw error;
  }
};

// Update an annexure B item
export const updateQuotationAnnexureB = async (item: QuotationAnnexureItem): Promise<void> => {
  try {
    if (!item.id) {
      throw new Error('Annexure item ID is required for update');
    }

    const now = Date.now();
    await db.runAsync(
      `UPDATE quotation_annexure_b SET 
        sr_no = ?, 
        description = ?, 
        amount = ?,
        updated_at = ? 
      WHERE id = ?;`,
      item.sr_no,
      item.description,
      item.amount,
      now,
      item.id
    );

    await updateQuotationTotalAmount(item.quotation_id);
  } catch (error) {
    console.error(`Error updating annexure B item with ID ${item.id}:`, error);
    throw error;
  }
};

// Update an annexure C item
export const updateQuotationAnnexureC = async (item: QuotationAnnexureItem): Promise<void> => {
  try {
    if (!item.id) {
      throw new Error('Annexure item ID is required for update');
    }

    const now = Date.now();
    await db.runAsync(
      `UPDATE quotation_annexure_c SET 
        sr_no = ?, 
        description = ?, 
        amount = ?,
        updated_at = ? 
      WHERE id = ?;`,
      item.sr_no,
      item.description,
      item.amount,
      now,
      item.id
    );

    await updateQuotationTotalAmount(item.quotation_id);
  } catch (error) {
    console.error(`Error updating annexure C item with ID ${item.id}:`, error);
    throw error;
  }
};

// Delete an annexure A item
export const deleteQuotationAnnexureA = async (id: number, quotationId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM quotation_annexure_a WHERE id = ?;', id);
    await updateQuotationTotalAmount(quotationId);
  } catch (error) {
    console.error(`Error deleting annexure A item with ID ${id}:`, error);
    throw error;
  }
};

// Delete an annexure B item
export const deleteQuotationAnnexureB = async (id: number, quotationId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM quotation_annexure_b WHERE id = ?;', id);
    await updateQuotationTotalAmount(quotationId);
  } catch (error) {
    console.error(`Error deleting annexure B item with ID ${id}:`, error);
    throw error;
  }
};

// Delete an annexure C item
export const deleteQuotationAnnexureC = async (id: number, quotationId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM quotation_annexure_c WHERE id = ?;', id);
    await updateQuotationTotalAmount(quotationId);
  } catch (error) {
    console.error(`Error deleting annexure C item with ID ${id}:`, error);
    throw error;
  }
};
