import { Lead } from '../database/leadsDb';
import { Client } from '../database/clientsDb';
import { addClient } from '../database';

/**
 * Converts a Lead to a Client
 * @param lead The lead to convert
 * @returns The ID of the newly created client
 */
export const convertLeadToClient = async (lead: Lead): Promise<number> => {
  try {
    // Create a new client from the lead
    const newClient: Client = {
      name: lead.name,
      // Other fields will be empty for now and can be filled in later
    };
    
    // Add the client to the database
    const clientId = await addClient(newClient);
    return clientId;
  } catch (error) {
    console.error('Error converting lead to client:', error);
    throw error;
  }
};
