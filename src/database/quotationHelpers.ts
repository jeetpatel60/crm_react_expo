import { db } from './database';

// Calculate and update the total amount for a quotation
export const updateQuotationTotalAmount = async (quotationId: number): Promise<void> => {
  try {
    // Get sum of all annexure A items
    const annexureASum = await db.getFirstAsync<{ total: number }>(
      'SELECT SUM(amount) as total FROM quotation_annexure_a WHERE quotation_id = ?;',
      quotationId
    );
    
    // Get sum of all annexure B items
    const annexureBSum = await db.getFirstAsync<{ total: number }>(
      'SELECT SUM(amount) as total FROM quotation_annexure_b WHERE quotation_id = ?;',
      quotationId
    );
    
    // Get sum of all annexure C items
    const annexureCSum = await db.getFirstAsync<{ total: number }>(
      'SELECT SUM(amount) as total FROM quotation_annexure_c WHERE quotation_id = ?;',
      quotationId
    );
    
    // Calculate total amount
    const totalAmount = 
      (annexureASum?.total || 0) + 
      (annexureBSum?.total || 0) + 
      (annexureCSum?.total || 0);
    
    // Update the quotation with the new total amount
    await db.runAsync(
      'UPDATE quotations SET total_amount = ?, updated_at = ? WHERE id = ?;',
      totalAmount,
      Date.now(),
      quotationId
    );
  } catch (error) {
    console.error(`Error updating total amount for quotation ID ${quotationId}:`, error);
    throw error;
  }
};
