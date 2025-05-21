import { db } from './database';

export interface PaymentReceiptTemplate {
  id?: number;
  name: string;
  content: string;
  created_at?: number;
  updated_at?: number;
}

// Get all payment receipt templates
export const getPaymentReceiptTemplates = async (): Promise<PaymentReceiptTemplate[]> => {
  try {
    return await db.getAllAsync<PaymentReceiptTemplate>(
      'SELECT * FROM payment_receipt_templates ORDER BY name ASC;'
    );
  } catch (error) {
    console.error('Error fetching payment receipt templates:', error);
    throw error;
  }
};

// Get payment receipt template by ID
export const getPaymentReceiptTemplateById = async (id: number): Promise<PaymentReceiptTemplate | null> => {
  try {
    return await db.getFirstAsync<PaymentReceiptTemplate>(
      'SELECT * FROM payment_receipt_templates WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching payment receipt template with ID ${id}:`, error);
    throw error;
  }
};

// Add a new payment receipt template
export const addPaymentReceiptTemplate = async (template: PaymentReceiptTemplate): Promise<number> => {
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO payment_receipt_templates (
        name, content, created_at, updated_at
      ) VALUES (?, ?, ?, ?);`,
      template.name,
      template.content,
      now,
      now
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding payment receipt template:', error);
    throw error;
  }
};

// Update a payment receipt template
export const updatePaymentReceiptTemplate = async (template: PaymentReceiptTemplate): Promise<void> => {
  try {
    if (!template.id) {
      throw new Error('Template ID is required for update');
    }

    const now = Date.now();
    await db.runAsync(
      `UPDATE payment_receipt_templates SET 
        name = ?, 
        content = ?,
        updated_at = ? 
      WHERE id = ?;`,
      template.name,
      template.content,
      now,
      template.id
    );
  } catch (error) {
    console.error(`Error updating payment receipt template with ID ${template.id}:`, error);
    throw error;
  }
};

// Delete a payment receipt template
export const deletePaymentReceiptTemplate = async (id: number): Promise<void> => {
  try {
    await db.runAsync(
      'DELETE FROM payment_receipt_templates WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error deleting payment receipt template with ID ${id}:`, error);
    throw error;
  }
};
