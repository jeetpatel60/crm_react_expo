import { db } from './database';

export interface AgreementTemplate {
  id?: number;
  name: string;
  content: string;
  created_at?: number;
  updated_at?: number;
}

// Get all agreement templates
export const getAgreementTemplates = async (): Promise<AgreementTemplate[]> => {
  try {
    return await db.getAllAsync<AgreementTemplate>(
      'SELECT * FROM agreement_templates ORDER BY name ASC;'
    );
  } catch (error) {
    console.error('Error fetching agreement templates:', error);
    throw error;
  }
};

// Get agreement template by ID
export const getAgreementTemplateById = async (id: number): Promise<AgreementTemplate | null> => {
  try {
    return await db.getFirstAsync<AgreementTemplate>(
      'SELECT * FROM agreement_templates WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching agreement template with ID ${id}:`, error);
    throw error;
  }
};

// Add a new agreement template
export const addAgreementTemplate = async (template: AgreementTemplate): Promise<number> => {
  try {
    const now = Date.now();
    const result = await db.runAsync(
      `INSERT INTO agreement_templates (
        name, content, created_at, updated_at
      ) VALUES (?, ?, ?, ?);`,
      template.name,
      template.content,
      now,
      now
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding agreement template:', error);
    throw error;
  }
};

// Update an agreement template
export const updateAgreementTemplate = async (template: AgreementTemplate): Promise<void> => {
  try {
    if (!template.id) {
      throw new Error('Template ID is required for update');
    }

    const now = Date.now();
    await db.runAsync(
      `UPDATE agreement_templates SET 
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
    console.error(`Error updating agreement template with ID ${template.id}:`, error);
    throw error;
  }
};

// Delete an agreement template
export const deleteAgreementTemplate = async (id: number): Promise<void> => {
  try {
    await db.runAsync(
      'DELETE FROM agreement_templates WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error deleting agreement template with ID ${id}:`, error);
    throw error;
  }
};
