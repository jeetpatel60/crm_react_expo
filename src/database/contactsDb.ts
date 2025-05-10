import { db } from './database';

export interface Contact {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at?: number;
  updated_at?: number;
}

// Get all contacts
export const getContacts = async (): Promise<Contact[]> => {
  try {
    return await db.getAllAsync<Contact>('SELECT * FROM contacts ORDER BY name ASC;');
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

// Get a contact by ID
export const getContactById = async (id: number): Promise<Contact> => {
  try {
    const contact = await db.getFirstAsync<Contact>('SELECT * FROM contacts WHERE id = ?;', id);
    if (!contact) {
      throw new Error('Contact not found');
    }
    return contact;
  } catch (error) {
    console.error('Error fetching contact:', error);
    throw error;
  }
};

// Add a new contact
export const addContact = async (contact: Contact): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO contacts (name, email, phone, company, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        contact.name,
        contact.email || null,
        contact.phone || null,
        contact.company || null,
        contact.notes || null,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

// Update a contact
export const updateContact = async (contact: Contact): Promise<void> => {
  if (!contact.id) {
    throw new Error('Contact ID is required');
  }

  try {
    const now = Date.now();

    await db.runAsync(
      `UPDATE contacts
       SET name = ?, email = ?, phone = ?, company = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        contact.name,
        contact.email || null,
        contact.phone || null,
        contact.company || null,
        contact.notes || null,
        now,
        contact.id
      ]
    );
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

// Delete a contact
export const deleteContact = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM contacts WHERE id = ?;', id);
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};
