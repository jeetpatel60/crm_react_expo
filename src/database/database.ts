import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Define the database type
export type DatabaseType = SQLite.SQLiteDatabase;

// Database instance - will be initialized during app startup
let database: DatabaseType | null = null;

/**
 * Initialize the database connection
 * Returns true if database was successfully initialized
 */
export const initializeDb = async (): Promise<boolean> => {
  try {
    console.log('Initializing database connection...');

    if (Platform.OS === 'web') {
      throw new Error('SQLite is not supported on web platform');
    }

    database = await SQLite.openDatabaseAsync('crm.db');
    console.log('SUCCESS: Using SQLite database. Database object:', database);

    // After opening the database, try to find where it's actually stored
    await findActualDatabasePath();

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Export the database getter function
// This ensures we have a safe way to access the database
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    console.error('ERROR: Database is null when getDatabase() is called.');
    throw new Error('Database not initialized. Call initializeDb() first.');
  }
  console.log('DEBUG: getDatabase() returning database object:', database);
  return database;
};

// Close the current database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    if (database && (database as any).closeAsync) {
      await (database as any).closeAsync();
    }
  } catch (e) {
    console.warn('Warning: error while closing database (continuing):', e);
  } finally {
    database = null;
  }
};

// Find the actual database path by testing where the database file exists
const findActualDatabasePath = async (): Promise<void> => {
  try {
    const FileSystem = require('expo-file-system');

    // Test if we can create a test table and then find the file
    if (database) {
      // Create a temporary test to ensure database is working
      await database.execAsync('CREATE TABLE IF NOT EXISTS _test_table_for_path (id INTEGER);');
      await database.execAsync('DROP TABLE IF EXISTS _test_table_for_path;');

      console.log('Database is working, now searching for the actual file...');

      // Search for the database file in common locations
      const searchPaths = [
        `${FileSystem.documentDirectory}SQLite/`,
        `${FileSystem.documentDirectory}`,
        `${FileSystem.documentDirectory}databases/`,
      ];

      for (const searchDir of searchPaths) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(searchDir);
          if (dirInfo.exists) {
            const files = await FileSystem.readDirectoryAsync(searchDir);
            for (const file of files) {
              if (file.includes('crm') && file.endsWith('.db')) {
                const fullPath = `${searchDir}${file}`;
                const fileInfo = await FileSystem.getInfoAsync(fullPath);
                if (fileInfo.exists && (fileInfo as any).size > 0) {
                  console.log(`Found active database file at: ${fullPath} (Size: ${(fileInfo as any).size} bytes)`);
                  return;
                }
              }
            }
          }
        } catch (searchError) {
          console.log(`Could not search directory ${searchDir}:`, searchError);
        }
      }
    }
  } catch (error) {
    console.warn('Could not determine actual database path:', error);
  }
};

// Get the actual database file path
export const getDatabasePath = async (): Promise<string> => {
  try {
    const FileSystem = require('expo-file-system');

    // List of possible database locations to check
    const possiblePaths = [
      // Standard Expo SQLite location
      `${FileSystem.documentDirectory}SQLite/crm.db`,
      // Alternative location for newer Expo versions
      `${FileSystem.documentDirectory}crm.db`,
      // Another possible location
      `${FileSystem.documentDirectory}databases/crm.db`,
      // Platform-specific locations
      Platform.OS === 'ios'
        ? `${FileSystem.documentDirectory}Library/LocalDatabase/crm.db`
        : `${FileSystem.documentDirectory}databases/crm.db`,
    ];

    console.log('Searching for database file in possible locations...');

    // Check each possible path
    for (const dbPath of possiblePaths) {
      console.log('Checking database path:', dbPath);
      try {
        const fileInfo = await FileSystem.getInfoAsync(dbPath);
        console.log(`Database file exists at ${dbPath}:`, fileInfo.exists);
        if (fileInfo.exists && (fileInfo as any).size > 0) {
          console.log('Found database at:', dbPath, 'Size:', (fileInfo as any).size);
          return dbPath;
        }
      } catch (pathError) {
        console.log(`Error checking path ${dbPath}:`, pathError);
        continue;
      }
    }

    // If no existing database found, try to find it by scanning directories
    console.log('No database found in standard locations, scanning directories...');

    try {
      // Scan the documents directory for any .db files
      const documentsFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      console.log('Files in documents directory:', documentsFiles);

      for (const file of documentsFiles) {
        if (file === 'crm.db') {
          const foundPath = `${FileSystem.documentDirectory}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(foundPath);
          if (fileInfo.exists && (fileInfo as any).size > 0) {
            console.log('Found database file in documents root:', foundPath);
            return foundPath;
          }
        }
      }

      // Check SQLite subdirectory
      const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
      const sqliteDirInfo = await FileSystem.getInfoAsync(sqliteDir);
      if (sqliteDirInfo.exists) {
        const sqliteFiles = await FileSystem.readDirectoryAsync(sqliteDir);
        console.log('Files in SQLite directory:', sqliteFiles);

        for (const file of sqliteFiles) {
          if (file === 'crm.db') {
            const foundPath = `${sqliteDir}${file}`;
            const fileInfo = await FileSystem.getInfoAsync(foundPath);
            if (fileInfo.exists && (fileInfo as any).size > 0) {
              console.log('Found database file in SQLite directory:', foundPath);
              return foundPath;
            }
          }
        }
      }
    } catch (scanError) {
      console.warn('Error scanning for database files:', scanError);
    }

    // If still not found, create the SQLite directory and return the standard path
    const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
    const sqliteDirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!sqliteDirInfo.exists) {
      console.log('Creating SQLite directory:', sqliteDir);
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    const defaultPath = `${sqliteDir}crm.db`;
    console.log('Using default database path (will be created when database is initialized):', defaultPath);
    return defaultPath;
  } catch (error) {
    console.error('Error getting database path:', error);
    // Fallback to standard path
    const fallbackPath = `${require('expo-file-system').documentDirectory}SQLite/crm.db`;
    console.log('Using fallback database path:', fallbackPath);
    return fallbackPath;
  }
};

// Reset database connection: close and reopen, then ensure schema/migrations
export const resetDatabase = async (): Promise<void> => {
  console.log('Resetting database connection...');
  await closeDatabase();

  // Add a small delay to ensure the connection is fully closed
  await new Promise(resolve => setTimeout(resolve, 100));

  await initializeDb();

  // Don't call initDatabase() here as it might recreate tables
  // The restored database should already have the correct schema
  console.log('Database connection reset complete');
};

// Restore database from backup file - handles the complete restoration process
export const restoreDatabaseFromFile = async (backupFilePath: string): Promise<void> => {
  try {
    console.log('Starting database restoration from:', backupFilePath);

    // Step 1: Close the current database connection completely
    console.log('Closing current database connection...');
    await closeDatabase();

    // Step 2: Get the target database path
    const targetDbPath = await getDatabasePath();
    console.log('Target database path:', targetDbPath);

    // Step 3: Ensure the SQLite directory exists
    const FileSystem = require('expo-file-system');
    const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
    const sqliteDirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!sqliteDirInfo.exists) {
      console.log('Creating SQLite directory:', sqliteDir);
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    // Step 4: Verify backup file before copying
    const backupFileInfo = await FileSystem.getInfoAsync(backupFilePath);
    console.log('Backup file info before copy:', {
      exists: backupFileInfo.exists,
      size: (backupFileInfo as any).size,
      path: backupFilePath
    });

    if (!backupFileInfo.exists) {
      throw new Error(`Backup file does not exist: ${backupFilePath}`);
    }

    // Step 5: Copy the backup file to the database location
    console.log('Copying backup file to database location...');
    console.log('From:', backupFilePath);
    console.log('To:', targetDbPath);

    await FileSystem.copyAsync({
      from: backupFilePath,
      to: targetDbPath,
    });

    // Step 6: Verify the file was copied successfully
    const restoredFileInfo = await FileSystem.getInfoAsync(targetDbPath);
    if (!restoredFileInfo.exists) {
      throw new Error('Failed to copy backup file to database location');
    }

    const originalSize = (backupFileInfo as any).size || 0;
    const restoredSize = (restoredFileInfo as any).size || 0;

    console.log('File copy verification:', {
      originalSize,
      restoredSize,
      sizesMatch: originalSize === restoredSize
    });

    if (originalSize !== restoredSize) {
      throw new Error(`File copy failed: size mismatch (original: ${originalSize}, restored: ${restoredSize})`);
    }

    // Step 7: Wait a moment to ensure file system operations are complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 8: Reinitialize the database connection
    console.log('Reinitializing database connection...');
    await initializeDb();

    // Step 9: Verify the restoration by checking if we can query the database
    console.log('Verifying database restoration...');

    // First, check if we can connect and query basic schema
    const tables = await db.getAllAsync('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('Available tables after restoration:', tables.map(t => (t as any).name));

    if (tables.length === 0) {
      throw new Error('Database restoration failed: No tables found in restored database');
    }

    // Step 10: Run migrations to ensure compatibility with current app version
    console.log('Running migrations to ensure schema compatibility...');
    try {
      await runMigrations();
      console.log('Migrations completed successfully after restoration');
    } catch (migrationError) {
      console.warn('Some migrations failed after restoration (this might be normal for older backups):', migrationError);
      // Don't fail the restoration if migrations have issues - the core data might still be intact
    }

    // Additional verification: Check if we have data in CRM tables
    // Define core tables that should exist in any valid CRM backup
    const coreTables = ['companies', 'clients', 'leads', 'projects', 'units_flats'];

    // Define all possible CRM tables (including newer ones)
    const allPossibleCrmTables = [
      // Core business tables
      'companies', 'clients', 'leads', 'projects', 'units_flats',
      // Project related tables
      'project_schedules', 'milestones',
      // Unit related tables
      'unit_customer_schedules', 'unit_payment_requests', 'unit_payment_receipts', 'unit_gst_records',
      // Quotation related tables
      'quotations', 'quotation_annexure_a', 'quotation_annexure_b', 'quotation_annexure_c',
      // Template tables
      'agreement_templates', 'payment_request_templates', 'payment_receipt_templates',
      // Legacy tables (might exist in older backups)
      'contacts', 'tasks'
    ];

    const verificationResults: Record<string, number> = {};
    let totalRecords = 0;
    let hasData = false;

    try {
      // Check each table if it exists
      const tableNames = tables.map(t => (t as any).name);

      for (const tableName of allPossibleCrmTables) {
        if (tableNames.includes(tableName)) {
          try {
            const result = await db.getFirstAsync<{count: number}>(`SELECT COUNT(*) as count FROM ${tableName}`);
            const count = result?.count || 0;
            verificationResults[tableName] = count;
            totalRecords += count;

            if (count > 0) {
              hasData = true;
              console.log(`Restored table ${tableName}: ${count} records`);
            }
          } catch (tableError) {
            console.warn(`Could not verify table ${tableName}:`, tableError);
            verificationResults[tableName] = -1; // Indicate error
          }
        }
      }

      console.log('Complete restored database verification:', {
        totalTables: Object.keys(verificationResults).length,
        totalRecords,
        hasData,
        tableBreakdown: verificationResults
      });

      if (!hasData) {
        console.warn('WARNING: Restored database appears to be empty (no data in any tables)');
        console.warn('This might indicate the backup file was empty or the restoration failed');
      } else {
        console.log(`SUCCESS: Restored database contains ${totalRecords} total records across ${Object.keys(verificationResults).length} tables`);
      }

      // Test actual data retrieval for tables that have data
      if (verificationResults.clients > 0) {
        const sampleClient = await db.getFirstAsync('SELECT * FROM clients LIMIT 1');
        console.log('Sample client data:', sampleClient);
      }

      if (verificationResults.projects > 0) {
        const sampleProject = await db.getFirstAsync('SELECT * FROM projects LIMIT 1');
        console.log('Sample project data:', sampleProject);
      }

    } catch (verificationError) {
      console.error('Error during database verification:', verificationError);
      throw new Error(`Database verification failed: ${verificationError instanceof Error ? verificationError.message : String(verificationError)}`);
    }

    console.log('Database restoration completed successfully');
  } catch (error) {
    console.error('Error in restoreDatabaseFromFile:', error);
    throw error;
  }
};

// Test database connectivity and data availability
export const testDatabaseConnection = async (): Promise<{
  connected: boolean;
  tablesExist: boolean;
  dataAvailable: boolean;
  counts: { clients: number; projects: number; units: number; leads: number };
  allTableCounts?: Record<string, number>;
  totalRecords?: number;
}> => {
  try {
    console.log('Testing database connection...');

    // Test basic connectivity
    const tables = await db.getAllAsync('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('Available tables:', tables.map(t => (t as any).name));

    // Define all CRM tables to check
    const allCrmTables = [
      'companies', 'clients', 'leads', 'projects', 'units_flats',
      'project_schedules', 'milestones',
      'unit_customer_schedules', 'unit_payment_requests', 'unit_payment_receipts', 'unit_gst_records',
      'quotations', 'quotation_annexure_a', 'quotation_annexure_b', 'quotation_annexure_c',
      'agreement_templates', 'payment_request_templates', 'payment_receipt_templates',
      'contacts', 'tasks'
    ];

    // Test data availability in core tables (for backward compatibility)
    const clientCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM clients') || { count: 0 };
    const projectCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM projects') || { count: 0 };
    const unitCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM units_flats') || { count: 0 };
    const leadCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM leads') || { count: 0 };

    // Check all CRM tables for comprehensive verification
    const tableNames = tables.map(t => (t as any).name);
    const allTableCounts: Record<string, number> = {};
    let totalRecords = 0;

    for (const tableName of allCrmTables) {
      if (tableNames.includes(tableName)) {
        try {
          const result = await db.getFirstAsync<{count: number}>(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = result?.count || 0;
          allTableCounts[tableName] = count;
          totalRecords += count;
        } catch (tableError) {
          console.warn(`Could not check table ${tableName}:`, tableError);
          allTableCounts[tableName] = -1; // Indicate error
        }
      }
    }

    const result = {
      connected: true,
      tablesExist: tables.length > 0,
      dataAvailable: totalRecords > 0,
      counts: {
        clients: clientCount.count,
        projects: projectCount.count,
        units: unitCount.count,
        leads: leadCount.count
      },
      allTableCounts,
      totalRecords
    };

    console.log('Database test result:', {
      ...result,
      tableBreakdown: allTableCounts
    });

    return result;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      connected: false,
      tablesExist: false,
      dataAvailable: false,
      counts: { clients: 0, projects: 0, units: 0, leads: 0 }
    };
  }
};


// For backward compatibility with existing code
// We create a simpler wrapper around the database
export const db = {
  execAsync: async (sql: string): Promise<void> => {
    return getDatabase().execAsync(sql);
  },

  runAsync: async (sql: string, ...params: any[]): Promise<{ lastInsertRowId: number, changes: number }> => {
    return getDatabase().runAsync(sql, ...params);
  },

  getFirstAsync: async <T = any>(sql: string, ...params: any[]): Promise<T | null> => {
    return getDatabase().getFirstAsync<T>(sql, ...params);
  },

  getAllAsync: async <T = any>(sql: string, ...params: any[]): Promise<T[]> => {
    return getDatabase().getAllAsync<T>(sql, ...params);
  },

  withTransactionAsync: async (callback: () => Promise<void>): Promise<void> => {
    return getDatabase().withTransactionAsync(callback);
  }
} as unknown as SQLite.SQLiteDatabase;

// Initialize the database schema
export const initDatabase = async (): Promise<void> => {
  try {
    console.log('Creating database tables...');

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Enable WAL mode for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create contacts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create tasks table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        due_date INTEGER,
        status TEXT NOT NULL,
        contact_id INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      );
    `);

    // Create companies table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        salutation TEXT,
        letterhead_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create clients table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        pan_no TEXT,
        gstin_no TEXT,
        contact_no TEXT,
        email TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create leads table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        enquiry_for TEXT,
        budget REAL,
        reference TEXT,
        lead_source TEXT,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create projects table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        start_date INTEGER,
        end_date INTEGER,
        progress REAL,
        total_budget REAL,
        status TEXT NOT NULL,
        company_id INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
      );
    `);

    // Create project_schedules table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS project_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      );
    `);

    // Create milestones table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        milestone_name TEXT NOT NULL,
        completion_percentage REAL NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (schedule_id) REFERENCES project_schedules (id) ON DELETE CASCADE
      );
    `);

    // Create project_milestones table (alias for milestones)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS project_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_schedule_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        milestone_name TEXT NOT NULL,
        completion_percentage REAL NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_schedule_id) REFERENCES project_schedules (id) ON DELETE CASCADE
      );
    `);

    // Create units_flats table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS units_flats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flat_no TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        client_id INTEGER,
        area_sqft REAL,
        rate_per_sqft REAL,
        flat_value REAL,
        received_amount REAL DEFAULT 0,
        balance_amount REAL,
        status TEXT NOT NULL,
        type TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL
      );
    `);
    console.log('units_flats table created or already exists.');

    // Create unit_customer_schedules table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS unit_customer_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        milestone TEXT NOT NULL,
        completion_percentage REAL NOT NULL,
        amount REAL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (unit_id) REFERENCES units_flats (id) ON DELETE CASCADE
      );
    `);

    // Create unit_payment_requests table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS unit_payment_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        date INTEGER NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (unit_id) REFERENCES units_flats (id) ON DELETE CASCADE
      );
    `);

    // Create unit_payment_receipts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS unit_payment_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        date INTEGER NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        mode TEXT,
        remarks TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (unit_id) REFERENCES units_flats (id) ON DELETE CASCADE
      );
    `);

    // Create quotations table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_no TEXT NOT NULL,
        date INTEGER NOT NULL,
        project_id INTEGER,
        lead_id INTEGER,
        flat_id INTEGER,
        company_id INTEGER,
        total_amount REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
        FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE SET NULL,
        FOREIGN KEY (flat_id) REFERENCES units_flats (id) ON DELETE SET NULL,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
      );
    `);

    // Create unit_gst_records table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS unit_gst_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        date INTEGER NOT NULL,
        remarks TEXT,
        r_amount REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (unit_id) REFERENCES units_flats (id) ON DELETE CASCADE
      );
    `);

    // Create quotation_annexure_a table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quotation_annexure_a (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
      );
    `);

    // Create quotation_annexure_b table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quotation_annexure_b (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
      );
    `);

    // Create quotation_annexure_c table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quotation_annexure_c (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id INTEGER NOT NULL,
        sr_no INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
      );
    `);

    console.log('Database tables created successfully');

    // Run migrations
    console.log('Calling runMigrations...');
    await runMigrations();
    console.log('runMigrations completed.');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
};

// Function to run database migrations
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('Running database migrations...');

    // Dynamically import and run migrations, passing getDatabase
    const { addClientIdToUnitsFlats } = await import('./migrations/addClientIdToUnitsFlats');
    await addClientIdToUnitsFlats(getDatabase);

    const { addCompanyIdToProjects } = await import('./migrations/addCompanyIdToProjects');
    await addCompanyIdToProjects(getDatabase);

    const { addTemplatesTables } = await import('./migrations/addTemplatesTables');
    await addTemplatesTables(getDatabase);

    const { addPaymentRequestIdToUnitPaymentReceipts } = await import('./migrations/addPaymentRequestIdToUnitPaymentReceipts');
    await addPaymentRequestIdToUnitPaymentReceipts(getDatabase);

    const { addPaymentReceiptTemplatesTable } = await import('./migrations/addPaymentReceiptTemplatesTable');
    await addPaymentReceiptTemplatesTable(getDatabase);

    const { addUnitFlatIdToLeads } = await import('./migrations/addUnitFlatIdToLeads');
    await addUnitFlatIdToLeads(getDatabase);

    const { addBValueWValueToUnitsFlats } = await import('./migrations/addBValueWValueToUnitsFlats');
    await addBValueWValueToUnitsFlats(getDatabase);

    const { addGstPercentageToUnitsFlats } = await import('./migrations/addGstPercentageToUnitsFlats');
    await addGstPercentageToUnitsFlats(getDatabase);

    const { addGstAmountToUnitsFlats } = await import('./migrations/addGstAmountToUnitsFlats');
    await addGstAmountToUnitsFlats(getDatabase);

    const { updateGstRecordsSchema } = await import('./migrations/updateGstRecordsSchema');
    await updateGstRecordsSchema(getDatabase);

    const { addCategoryToUnitsFlats } = await import('./migrations/addCategoryToUnitsFlats');
    await addCategoryToUnitsFlats(getDatabase);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  }
};
