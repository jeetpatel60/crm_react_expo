import { Alert } from 'react-native';
import { addClientIdToUnitsFlats } from '../database/migrations/addClientIdToUnitsFlats';

/**
 * Run the client ID migration manually
 * This can be used if the automatic migration fails
 */
export const runClientIdMigration = async (): Promise<void> => {
  try {
    console.log('Running client ID migration manually...');
    await addClientIdToUnitsFlats();
    console.log('Client ID migration completed successfully');
    Alert.alert('Success', 'Client ID migration completed successfully');
  } catch (error) {
    console.error('Error running client ID migration:', error);
    Alert.alert('Error', `Failed to run client ID migration: ${error instanceof Error ? error.message : String(error)}`);
  }
};
