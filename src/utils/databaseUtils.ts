import { initDatabase, initializeDb } from '../database';
import { Platform, Alert } from 'react-native';

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database...');

    // Check if we're on web platform
    if (Platform.OS === 'web') {
      const message = 'SQLite database is not supported on web. Please use a native device.';
      console.error(message);

      // Show alert to user
      if (typeof Alert !== 'undefined') {
        Alert.alert(
          'Database Error',
          message,
          [{ text: 'OK' }]
        );
      }

      throw new Error(message);
    }

    // Initialize the database connection
    await initializeDb();
    console.log('Using real SQLite database');

    // Then, create the tables
    await initDatabase();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const seedDemoData = async (): Promise<void> => {
  // This function can be implemented later to seed demo data
  console.log('Seeding demo data is not implemented yet');
};
