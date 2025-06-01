import { db, initDatabase, initializeDb, addCompanyIdToProjects, addTemplatesTables, addClientIdToUnitsFlats } from '../database';
import { Platform, Alert } from 'react-native';

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('=== DATABASE INITIALIZATION START ===');
    console.log('Platform:', Platform.OS);
    console.log('Platform Version:', Platform.Version);

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

    // Step 1: Initialize the database connection with retry logic
    console.log('Step 1: Initializing database connection...');
    let dbInitialized = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!dbInitialized && retryCount < maxRetries) {
      try {
        await initializeDb();
        dbInitialized = true;
        console.log('✓ Database connection established successfully');
      } catch (dbError) {
        retryCount++;
        console.error(`Database connection attempt ${retryCount} failed:`, dbError);

        if (retryCount >= maxRetries) {
          throw new Error(`Failed to establish database connection after ${maxRetries} attempts: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Step 2: Create tables and run migrations
    console.log('Step 2: Creating database tables and running migrations...');
    try {
      await initDatabase();
      console.log('✓ Database tables and migrations completed successfully');
    } catch (tableError) {
      console.error('Failed to create tables or run migrations:', tableError);
      throw new Error(`Database schema initialization failed: ${tableError instanceof Error ? tableError.message : String(tableError)}`);
    }

    // Step 3: Verify critical tables exist
    console.log('Step 3: Verifying database integrity...');
    const criticalTables = [
      'units_flats',
      'companies',
      'clients',
      'leads',
      'projects',
      'quotations'
    ];

    for (const tableName of criticalTables) {
      try {
        const tableInfo = await db.getAllAsync(`PRAGMA table_info(${tableName});`);
        if (tableInfo.length > 0) {
          console.log(`✓ Table '${tableName}' verified successfully`);
        } else {
          console.warn(`⚠ Table '${tableName}' exists but has no columns`);
        }
      } catch (verifyError) {
        console.error(`✗ Failed to verify table '${tableName}':`, verifyError);
        // Don't throw here, just log the warning
      }
    }

    // Step 4: Test basic database operations
    console.log('Step 4: Testing basic database operations...');
    try {
      await db.execAsync('PRAGMA integrity_check;');
      console.log('✓ Database integrity check passed');
    } catch (integrityError) {
      console.error('Database integrity check failed:', integrityError);
      throw new Error(`Database integrity check failed: ${integrityError instanceof Error ? integrityError.message : String(integrityError)}`);
    }

    console.log('=== DATABASE INITIALIZATION COMPLETE ===');

  } catch (error) {
    console.error('=== DATABASE INITIALIZATION FAILED ===');
    console.error('Error details:', error);

    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Provide more specific error messages
    let userFriendlyMessage = 'Unknown database error occurred';

    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        userFriendlyMessage = 'Failed to connect to the database. Please restart the app.';
      } else if (error.message.includes('schema')) {
        userFriendlyMessage = 'Database structure initialization failed. The app may need to be reinstalled.';
      } else if (error.message.includes('integrity')) {
        userFriendlyMessage = 'Database corruption detected. Please clear app data or reinstall.';
      } else {
        userFriendlyMessage = error.message;
      }
    }

    throw new Error(userFriendlyMessage);
  }
};

export const seedDemoData = async (): Promise<void> => {
  // This function can be implemented later to seed demo data
  console.log('Seeding demo data is not implemented yet');
};
