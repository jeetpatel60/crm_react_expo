import { db } from './database';

export interface Client {
  id?: number;
  name: string;
  address?: string;
  pan_no?: string;
  gstin_no?: string;
  contact_no?: string;
  email?: string;
  created_at?: number;
  updated_at?: number;
}

// Get all clients
export const getClients = async (): Promise<Client[]> => {
  try {
    return await db.getAllAsync<Client>('SELECT * FROM clients ORDER BY name ASC;');
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

// Get a client by ID
export const getClientById = async (id: number): Promise<Client> => {
  try {
    const client = await db.getFirstAsync<Client>('SELECT * FROM clients WHERE id = ?;', id);
    if (!client) {
      throw new Error('Client not found');
    }
    return client;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

// Add a new client
export const addClient = async (client: Client): Promise<number> => {
  try {
    const now = Date.now();

    const result = await db.runAsync(
      `INSERT INTO clients (name, address, pan_no, gstin_no, contact_no, email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        client.name,
        client.address || null,
        client.pan_no || null,
        client.gstin_no || null,
        client.contact_no || null,
        client.email || null,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};

// Update a client
export const updateClient = async (client: Client): Promise<void> => {
  if (!client.id) {
    throw new Error('Client ID is required');
  }

  try {
    const now = Date.now();

    await db.runAsync(
      `UPDATE clients
       SET name = ?, address = ?, pan_no = ?, gstin_no = ?, contact_no = ?, email = ?, updated_at = ?
       WHERE id = ?;`,
      [
        client.name,
        client.address || null,
        client.pan_no || null,
        client.gstin_no || null,
        client.contact_no || null,
        client.email || null,
        now,
        client.id
      ]
    );
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// Delete a client
export const deleteClient = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM clients WHERE id = ?;', id);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
