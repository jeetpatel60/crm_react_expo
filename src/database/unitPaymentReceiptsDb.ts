import { db } from './database';
import { getUnitFlatById, updateUnitFlatReceivedAmount } from './unitsFlatDb';

export interface UnitPaymentReceipt {
  id?: number;
  unit_id: number; // Revert unit_id to required
  sr_no: number;
  date: number; // timestamp
  description?: string;
  amount: number;
  mode?: string;
  remarks?: string;
  payment_request_id?: number; // Link to UnitPaymentRequest
  created_at?: number;
  updated_at?: number;
}

// Get all payment receipts for a unit
export const getUnitPaymentReceipts = async (unitId: number): Promise<UnitPaymentReceipt[]> => {
  try {
    return await db.getAllAsync<UnitPaymentReceipt>(
      'SELECT * FROM unit_payment_receipts WHERE unit_id = ? ORDER BY sr_no ASC;',
      [unitId]
    );
  } catch (error) {
    console.error(`Error fetching payment receipts for unit ID ${unitId}:`, error);
    throw error;
  }
};

// Get all payment receipts for a client
export const getUnitPaymentReceiptsByClientId = async (clientId: number): Promise<UnitPaymentReceipt[]> => {
  try {
    return await db.getAllAsync<UnitPaymentReceipt>(
      `SELECT upr.* FROM unit_payment_receipts upr
       JOIN units_flat uf ON upr.unit_id = uf.id
       WHERE uf.client_id = ? ORDER BY upr.date ASC;`,
      [clientId]
    );
  } catch (error) {
    console.error(`Error fetching payment receipts for client ID ${clientId}:`, error);
    throw error;
  }
};

// Get a payment receipt by ID
export const getUnitPaymentReceiptById = async (id: number): Promise<UnitPaymentReceipt | null> => {
  try {
    return await db.getFirstAsync<UnitPaymentReceipt>(
      'SELECT * FROM unit_payment_receipts WHERE id = ?;',
      [id]
    );
  } catch (error) {
    console.error(`Error fetching payment receipt with ID ${id}:`, error);
    throw error;
  }
};

// Add a new payment receipt
export const addUnitPaymentReceipt = async (receipt: UnitPaymentReceipt): Promise<number> => {
  try {
    const now = Date.now();
    let lastInsertId = 0;

    // Start a transaction
    await db.withTransactionAsync(async () => {
      // Insert the payment receipt
      const result = await db.runAsync(
        `INSERT INTO unit_payment_receipts (
          unit_id, sr_no, date, description, amount, mode, remarks, payment_request_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          receipt.unit_id || null, // Handle optional unit_id
          receipt.sr_no,
          receipt.date,
          receipt.description || null,
          receipt.amount,
          receipt.mode || null,
          receipt.remarks || null,
          receipt.payment_request_id || null, // Add payment_request_id
          now,
          now
        ]
      );
      lastInsertId = result.lastInsertRowId;

      // Update the unit's received amount
      if (receipt.unit_id) { // Check if unit_id is defined
        const unit = await getUnitFlatById(receipt.unit_id);
        if (unit) {
          const currentReceived = unit.received_amount || 0;
          const newReceived = currentReceived + receipt.amount;
          await updateUnitFlatReceivedAmount(receipt.unit_id, newReceived);
        }
      }
    });

    // Get all receipts to calculate the total received amount
    if (receipt.unit_id) { // Check if unit_id is defined
      const receipts = await getUnitPaymentReceipts(receipt.unit_id);
      const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);
      // Update the unit's received amount with the total from all receipts
      await updateUnitFlatReceivedAmount(receipt.unit_id, totalReceived);
    }

    return lastInsertId;
  } catch (error) {
    console.error('Error adding payment receipt:', error);
    throw error;
  }
};

// Update a payment receipt
export const updateUnitPaymentReceipt = async (receipt: UnitPaymentReceipt): Promise<void> => {
  if (!receipt.id) {
    throw new Error('Payment receipt ID is required');
  }

  try {
    const now = Date.now();
    const oldReceipt = await getUnitPaymentReceiptById(receipt.id);

    // Start a transaction
    await db.withTransactionAsync(async () => {
      // Update the payment receipt
      await db.runAsync(
        `UPDATE unit_payment_receipts SET
          unit_id = ?,
          sr_no = ?,
          date = ?,
          description = ?,
          amount = ?,
          mode = ?,
          remarks = ?,
          payment_request_id = ?,
          updated_at = ?
        WHERE id = ?;`,
        [
          receipt.unit_id || null, // Handle optional unit_id
          receipt.sr_no,
          receipt.date,
          receipt.description || null,
          receipt.amount,
          receipt.mode || null,
          receipt.remarks || null,
          receipt.payment_request_id || null, // Add payment_request_id
          now,
          receipt.id! // Non-null assertion as ID is checked at function start
        ]
      );
    });

    if (receipt.unit_id) { // Check if unit_id is defined
      // Get all receipts to recalculate the total received amount
      const receipts = await getUnitPaymentReceipts(receipt.unit_id);
      const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);

      // Update the unit's received amount with the total from all receipts
      await updateUnitFlatReceivedAmount(receipt.unit_id, totalReceived);
    }
  } catch (error) {
    console.error(`Error updating payment receipt with ID ${receipt.id}:`, error);
    throw error;
  }
};

// Delete a payment receipt
export const deleteUnitPaymentReceipt = async (id: number): Promise<void> => {
  try {
    const receipt = await getUnitPaymentReceiptById(id);
    if (!receipt) {
      throw new Error(`Payment receipt with ID ${id} not found`);
    }

    const unitId: number = receipt.unit_id as number; // Force assertion
    if (unitId === 0) { // Keep this check for invalid IDs (if 0 is considered invalid)
      throw new Error('Unit ID is missing or invalid for payment receipt.');
    }

    // Delete the payment receipt
    await db.runAsync('DELETE FROM unit_payment_receipts WHERE id = ?;', [id]);

    // Get all remaining receipts to recalculate the total received amount
    const receipts = await getUnitPaymentReceipts(unitId as number); // Explicit cast
    const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);

    // Update the unit's received amount with the total from all receipts
    await updateUnitFlatReceivedAmount(unitId as number, totalReceived); // Explicit cast
  } catch (error) {
    console.error(`Error deleting payment receipt with ID ${id}:`, error);
    throw error;
  }
};
