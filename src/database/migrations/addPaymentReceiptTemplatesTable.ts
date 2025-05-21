import { db } from '../database';

/**
 * Migration to add payment_receipt_templates table
 */
export const addPaymentReceiptTemplatesTable = async (): Promise<void> => {
  try {
    console.log('Creating payment_receipt_templates table...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payment_receipt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    console.log('payment_receipt_templates table created successfully');
  } catch (error) {
    console.error('Error creating payment_receipt_templates table:', error);
    throw error;
  }
};
