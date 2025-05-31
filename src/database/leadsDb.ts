import { db } from './database';

export type LeadStatus = 'Lead' | 'Contacted' | 'Quote Given' | 'Converted';

export interface Lead {
  id?: number;
  name: string;
  enquiry_for?: string;
  unit_flat_id?: number;
  budget?: number;
  reference?: string;
  lead_source?: string;
  status: LeadStatus;
  created_at?: number;
  updated_at?: number;
}

// Get all leads
export const getLeads = async (): Promise<Lead[]> => {
  try {
    return await db.getAllAsync<Lead>('SELECT * FROM leads ORDER BY created_at DESC;');
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

// Get lead by ID
export const getLeadById = async (id: number): Promise<Lead | null> => {
  try {
    return await db.getFirstAsync<Lead>(
      'SELECT * FROM leads WHERE id = ?;',
      id
    );
  } catch (error) {
    console.error(`Error fetching lead with ID ${id}:`, error);
    throw error;
  }
};

// Add a new lead
export const addLead = async (lead: Lead): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO leads (name, enquiry_for, unit_flat_id, budget, reference, lead_source, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        lead.name,
        lead.enquiry_for || null,
        lead.unit_flat_id || null,
        lead.budget || null,
        lead.reference || null,
        lead.lead_source || null,
        lead.status,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding lead:', error);
    throw error;
  }
};

// Update an existing lead
export const updateLead = async (lead: Lead): Promise<void> => {
  try {
    if (!lead.id) {
      throw new Error('Lead ID is required for update');
    }

    const now = Date.now();

    await db.runAsync(
      `UPDATE leads
       SET name = ?, enquiry_for = ?, unit_flat_id = ?, budget = ?, reference = ?, lead_source = ?, status = ?, updated_at = ?
       WHERE id = ?;`,
      [
        lead.name,
        lead.enquiry_for || null,
        lead.unit_flat_id || null,
        lead.budget || null,
        lead.reference || null,
        lead.lead_source || null,
        lead.status,
        now,
        lead.id
      ]
    );
  } catch (error) {
    console.error(`Error updating lead with ID ${lead.id}:`, error);
    throw error;
  }
};

// Delete a lead
export const deleteLead = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM leads WHERE id = ?;', id);
  } catch (error) {
    console.error(`Error deleting lead with ID ${id}:`, error);
    throw error;
  }
};
