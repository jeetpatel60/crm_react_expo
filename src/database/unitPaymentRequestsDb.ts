import { db } from './database';

export interface UnitPaymentRequest {
  id?: number;
  unit_id: number;
  sr_no: number;
  date: number; // timestamp
  description?: string;
  amount: number;
  created_at?: number;
  updated_at?: number;
}

// Get all payment requests for a unit
export const getUnitPaymentRequests = async (unitId: number): Promise<UnitPaymentRequest[]> => {
  try {
    return await db.getAllAsync<UnitPaymentRequest>(
      'SELECT * FROM unit_payment_requests WHERE unit_id = ? ORDER BY sr_no ASC;',
      unitId
    );
  } catch (error) {
    console.error(`Error fetching payment requests for unit ID ${unitId}:`, error);
    throw error;
  }
};

// Get a payment request by ID
export const getUnitPaymentRequestById = async (id: number): Promise<UnitPaymentRequest | null> => {
  try {
    return await db.getFirstAsync<UnitPaymentRequest>(
      'SELECT * FROM unit_payment_requests WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching payment request with ID ${id}:`, error);
    throw error;
  }
};

// Add a new payment request
export const addUnitPaymentRequest = async (request: UnitPaymentRequest): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO unit_payment_requests (
        unit_id, sr_no, date, description, amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        request.unit_id,
        request.sr_no,
        request.date,
        request.description || null,
        request.amount,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding payment request:', error);
    throw error;
  }
};

// Update a payment request
export const updateUnitPaymentRequest = async (request: UnitPaymentRequest): Promise<void> => {
  if (!request.id) {
    throw new Error('Payment request ID is required');
  }

  try {
    const now = Date.now();

    await db.runAsync(
      `UPDATE unit_payment_requests SET
        unit_id = ?,
        sr_no = ?,
        date = ?,
        description = ?,
        amount = ?,
        updated_at = ?
      WHERE id = ?;`,
      [
        request.unit_id,
        request.sr_no,
        request.date,
        request.description || null,
        request.amount,
        now,
        request.id
      ]
    );
  } catch (error) {
    console.error(`Error updating payment request with ID ${request.id}:`, error);
    throw error;
  }
};

// Delete a payment request
export const deleteUnitPaymentRequest = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM unit_payment_requests WHERE id = ?;', id);
  } catch (error) {
    console.error(`Error deleting payment request with ID ${id}:`, error);
    throw error;
  }
};
