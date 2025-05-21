import { db } from '../database';

export const addPaymentRequestIdToUnitPaymentReceipts = async (): Promise<void> => {
  try {
    // Check if the column already exists
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(unit_payment_receipts);"
    );

    const paymentRequestIdColumnExists = tableInfo.some(
      (column: any) => column.name === 'payment_request_id'
    );

    if (!paymentRequestIdColumnExists) {
      console.log('Adding payment_request_id column to unit_payment_receipts table...');

      // Add the payment_request_id column
      await db.execAsync(
        `ALTER TABLE unit_payment_receipts ADD COLUMN payment_request_id INTEGER REFERENCES unit_payment_requests(id) ON DELETE SET NULL;`
      );

      console.log('payment_request_id column added successfully to unit_payment_receipts table');
    } else {
      console.log('payment_request_id column already exists in unit_payment_receipts table');
    }
  } catch (error) {
    console.error('Error adding payment_request_id column to unit_payment_receipts table:', error);
    throw error;
  }
};
