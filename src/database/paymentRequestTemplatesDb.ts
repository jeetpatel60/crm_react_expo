import { db } from './database';

export interface PaymentRequestTemplate {
  id?: number;
  name: string;
  content: string;
  created_at?: number;
  updated_at?: number;
}

// Get all payment request templates
export const getPaymentRequestTemplates = async (): Promise<PaymentRequestTemplate[]> => {
  try {
    return await db.getAllAsync<PaymentRequestTemplate>(
      'SELECT * FROM payment_request_templates ORDER BY name ASC;'
    );
  } catch (error) {
    console.error('Error fetching payment request templates:', error);
    throw error;
  }
};

// Get payment request template by ID
export const getPaymentRequestTemplateById = async (id: number): Promise<PaymentRequestTemplate | null> => {
  try {
    return await db.getFirstAsync<PaymentRequestTemplate>(
      'SELECT * FROM payment_request_templates WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching payment request template with ID ${id}:`, error);
    throw error;
  }
};

// Add a new payment request template
export const addPaymentRequestTemplate = async (template: PaymentRequestTemplate): Promise<number> => {
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO payment_request_templates (
        name, content, created_at, updated_at
      ) VALUES (?, ?, ?, ?);`,
      template.name,
      template.content,
      now,
      now
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding payment request template:', error);
    throw error;
  }
};

// Update a payment request template
export const updatePaymentRequestTemplate = async (template: PaymentRequestTemplate): Promise<void> => {
  try {
    if (!template.id) {
      throw new Error('Template ID is required for update');
    }

    const now = Date.now();
    await db.runAsync(
      `UPDATE payment_request_templates SET 
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
    console.error(`Error updating payment request template with ID ${template.id}:`, error);
    throw error;
  }
};

// Delete a payment request template
export const deletePaymentRequestTemplate = async (id: number): Promise<void> => {
  try {
    await db.runAsync(
      'DELETE FROM payment_request_templates WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error deleting payment request template with ID ${id}:`, error);
    throw error;
  }
};
