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
       JOIN units_flats uf ON upr.unit_id = uf.id
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
    console.error('Payment receipt ID is required');
    throw new Error('Payment receipt ID is required');
  }

  try {
    console.log(`Attempting to update payment receipt with ID: ${receipt.id}`);

    const now = Date.now();
    const oldReceipt = await getUnitPaymentReceiptById(receipt.id);

    if (!oldReceipt) {
      console.error(`Payment receipt with ID ${receipt.id} not found`);
      throw new Error(`Payment receipt with ID ${receipt.id} not found`);
    }

    // Validate unit_id
    if (!receipt.unit_id) {
      console.error(`Unit ID is missing for payment receipt with ID ${receipt.id}`);
      throw new Error('Unit ID is missing for payment receipt.');
    }

    console.log(`Found receipt with ID ${receipt.id} for unit ID ${receipt.unit_id}`);
    console.log(`Updating receipt: ${JSON.stringify(receipt)}`);

    // Use a transaction to ensure data consistency
    await db.withTransactionAsync(async () => {
      // Update the payment receipt
      const updateResult = await db.runAsync(
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
          receipt.unit_id,
          receipt.sr_no,
          receipt.date,
          receipt.description || null,
          receipt.amount,
          receipt.mode || null,
          receipt.remarks || null,
          receipt.payment_request_id || null,
          now,
          receipt.id
        ]
      );

      console.log(`Update result:`, updateResult);

      // Get all receipts to recalculate the total received amount
      const receipts = await getUnitPaymentReceipts(receipt.unit_id);
      const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);
      console.log(`Recalculated total received amount: ${totalReceived}`);

      // Update the unit's received amount with the total from all receipts
      await updateUnitFlatReceivedAmount(receipt.unit_id, totalReceived);
    });

    console.log(`Successfully updated payment receipt with ID ${receipt.id}`);
  } catch (error) {
    console.error(`Error updating payment receipt with ID ${receipt.id}:`, error);
    throw error;
  }
};

// Delete a payment receipt
export const deleteUnitPaymentReceipt = async (id: number): Promise<void> => {
  try {
    console.log(`Attempting to delete payment receipt with ID: ${id}`);

    // First, get the receipt to check if it exists and to get the unit_id
    const receipt = await getUnitPaymentReceiptById(id);
    if (!receipt) {
      console.error(`Payment receipt with ID ${id} not found`);
      throw new Error(`Payment receipt with ID ${id} not found`);
    }

    // Validate unit_id
    if (!receipt.unit_id) {
      console.error(`Unit ID is missing for payment receipt with ID ${id}`);
      throw new Error('Unit ID is missing for payment receipt.');
    }

    const unitId = receipt.unit_id;
    console.log(`Found receipt with ID ${id} for unit ID ${unitId}`);

    // Use a transaction to ensure data consistency
    await db.withTransactionAsync(async () => {
      console.log(`Deleting payment receipt with ID ${id}`);
      // Delete the payment receipt
      const deleteResult = await db.runAsync('DELETE FROM unit_payment_receipts WHERE id = ?;', [id]);
      console.log(`Delete result:`, deleteResult);

      // Get all remaining receipts to recalculate the total received amount
      const receipts = await getUnitPaymentReceipts(unitId);
      const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);
      console.log(`Recalculated total received amount: ${totalReceived}`);

      // Update the unit's received amount with the total from all receipts
      await updateUnitFlatReceivedAmount(unitId, totalReceived);
    });

    console.log(`Successfully deleted payment receipt with ID ${id}`);
  } catch (error) {
    console.error(`Error deleting payment receipt with ID ${id}:`, error);
    throw error;
  }
};
