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
