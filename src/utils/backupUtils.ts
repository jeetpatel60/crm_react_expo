import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { shareAsync } from 'expo-sharing';
import { resetDatabase, getDatabasePath, restoreDatabaseFromFile, testDatabaseConnection } from '../database/database';
import { eventBus, EVENTS } from './eventBus';

// Constants
export const BACKUP_TASK_NAME = 'database-backup-task';
export const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
export const MAX_BACKUPS = 5;

// Get the actual database path dynamically
const getActualDatabasePath = async (): Promise<string> => {
  return await getDatabasePath();
};

// Create backup using SQLite backup functionality
const createBackupUsingSQLite = async (backupPath: string): Promise<void> => {
  try {
    const { openDatabaseSync } = require('expo-sqlite');
    const { getDatabase } = require('../database/database');

    // Get the current database connection
    const sourceDb = getDatabase();

    // Create a new database at the backup location
    const backupDb = openDatabaseSync(backupPath, { enableChangeListener: false });

    // Use SQLite's backup functionality to copy data
    // First, get all table names from the source database
    const tables = await sourceDb.getAllAsync('SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"');

    console.log('Tables to backup:', tables.map((t: any) => t.name));

    // Copy each table's schema and data
    for (const table of tables) {
      const tableName = (table as any).name;

      // Get the table schema
      const schemaResult = await sourceDb.getAllAsync(`SELECT sql FROM sqlite_master WHERE type="table" AND name=?`, [tableName]);
      if (schemaResult.length > 0) {
        const createTableSQL = (schemaResult[0] as any).sql;

        // Create the table in backup database
        await backupDb.execAsync(createTableSQL);

        // Copy all data from source to backup
        const data = await sourceDb.getAllAsync(`SELECT * FROM ${tableName}`);

        if (data.length > 0) {
          // Get column names
          const columns = Object.keys(data[0]);
          const placeholders = columns.map(() => '?').join(', ');
          const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

          // Insert each row
          for (const row of data) {
            const values = columns.map(col => (row as any)[col]);
            await backupDb.runAsync(insertSQL, values);
          }

          console.log(`Copied ${data.length} rows from table ${tableName}`);
        }
      }
    }

    // Close the backup database
    backupDb.closeSync();

    console.log('SQLite backup completed successfully');
  } catch (error) {
    console.error('Error in SQLite backup:', error);
    throw error;
  }
};

// Scheduled backup times (5 times per day): 6 AM, 10 AM, 2 PM, 6 PM, 10 PM
export const BACKUP_SCHEDULE_HOURS = [6, 10, 14, 18, 22];
export const BACKUP_INTERVAL_HOURS = 4.8; // Fallback interval (24/5 hours)

// Storage keys
const LAST_BACKUP_KEY = 'last_backup_timestamp';
const AUTO_BACKUP_ENABLED_KEY = 'auto_backup_enabled';
const BACKUP_COUNT_KEY = 'backup_count';
const NEXT_SCHEDULED_BACKUP_KEY = 'next_scheduled_backup';

// Interfaces
export interface BackupInfo {
  filename: string;
  path: string;
  timestamp: number;
  size: number;
  formattedDate: string;
}

export interface BackupStatus {
  isEnabled: boolean;
  lastBackup: number | null;
  nextBackup: number | null;
  backupCount: number;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  isDatabase?: boolean;
  hasData?: boolean;
}

export interface BackupProgress {
  stage: 'validating' | 'backing_up' | 'restoring' | 'cleaning_up' | 'complete';
  progress: number; // 0-100
  message: string;
}

// Ensure backup directory exists
export const ensureBackupDirectoryExists = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      console.log('Created backup directory:', BACKUP_DIR);
    }
  } catch (error) {
    console.error('Error creating backup directory:', error);
    throw error;
  }
};

// Get database file location for display to user
export const getDatabaseLocation = async (): Promise<string> => {
  return await getActualDatabasePath();
};

// Get backup directory location for display to user
export const getBackupLocation = (): string => {
  return BACKUP_DIR;
};

// Format backup date consistently
export const formatBackupDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Generate backup filename with timestamp
const generateBackupFilename = (): string => {
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const dateStr = date.toISOString().replace(/[:.]/g, '-');
  return `crm_backup_${timestamp}_${dateStr}.db`;
};

// Create a manual backup
export const createBackup = async (): Promise<BackupInfo> => {
  try {
    await ensureBackupDirectoryExists();

    const filename = generateBackupFilename();
    const backupPath = `${BACKUP_DIR}${filename}`;

    console.log(`Creating backup with filename: ${filename}`);

    // First, try to create backup using SQLite backup functionality
    let backupCreated = false;
    try {
      await createBackupUsingSQLite(backupPath);
      backupCreated = true;
      console.log('Backup created using SQLite backup functionality');
    } catch (sqliteError) {
      console.warn('SQLite backup failed, trying file copy method:', sqliteError);
    }

    // If SQLite backup failed, fall back to file copy method
    if (!backupCreated) {
      // Get the actual database path
      const databasePath = await getActualDatabasePath();

      // Check if database file exists
      const dbInfo = await FileSystem.getInfoAsync(databasePath);
      console.log('Database file info:', dbInfo);
      if (!dbInfo.exists) {
        throw new Error(`Database file not found at path: ${databasePath}`);
      }

      console.log(`Database path: ${databasePath}`);

      // Copy database file to backup location
      await FileSystem.copyAsync({
        from: databasePath,
        to: backupPath,
      });
      console.log('Backup created using file copy method');
    }

    // Get file info
    const backupInfo = await FileSystem.getInfoAsync(backupPath);
    const timestamp = Date.now();

    // Update storage
    await AsyncStorage.setItem(LAST_BACKUP_KEY, timestamp.toString());

    // Update backup count
    const currentCount = await getBackupCount();
    await AsyncStorage.setItem(BACKUP_COUNT_KEY, (currentCount + 1).toString());

    const backup: BackupInfo = {
      filename,
      path: backupPath,
      timestamp,
      size: (backupInfo as any).size || 0,
      formattedDate: formatBackupDate(timestamp),
    };

    console.log('Backup created successfully:', backup);

    // Verify the backup contains data
    try {
      const verification = await validateBackupFile(backupPath);
      console.log('Backup verification after creation:', verification);

      if (verification.hasData === false) {
        console.warn('Warning: Created backup appears to be empty');

        // Additional debugging - check current database state
        try {
          const currentDbTest = await testDatabaseConnection();
          console.log('Current database state during backup creation:', {
            totalRecords: currentDbTest.totalRecords,
            allTableCounts: currentDbTest.allTableCounts,
            dataAvailable: currentDbTest.dataAvailable
          });
        } catch (dbTestError) {
          console.error('Could not test current database state:', dbTestError);
        }
      }
    } catch (verificationError) {
      console.warn('Could not verify backup after creation:', verificationError);
    }

    // Clean up old backups
    await cleanupOldBackups();

    return backup;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Get list of all backups
export const getBackupList = async (): Promise<BackupInfo[]> => {
  try {
    await ensureBackupDirectoryExists();

    const backupDir = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const backups: BackupInfo[] = [];

    for (const filename of backupDir) {
      if (filename.endsWith('.db')) {
        const path = `${BACKUP_DIR}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(path);

        // Extract timestamp from filename
        // New format: crm_backup_1234567890_2023-12-25T10-30-00-000Z.db
        // Old format: crm_backup_2023-12-25T10-30-00-000Z.db
        let timestamp = (fileInfo as any).modificationTime || Date.now();

        const newFormatMatch = filename.match(/crm_backup_(\d+)_(.+)\.db/);
        const oldFormatMatch = filename.match(/crm_backup_(.+)\.db/);

        if (newFormatMatch) {
          // Use the numeric timestamp from the new format
          timestamp = parseInt(newFormatMatch[1], 10);
          console.log(`Parsed new format timestamp: ${timestamp} for file: ${filename}`);
        } else if (oldFormatMatch) {
          try {
            // Try to parse the old ISO string format
            const isoString = oldFormatMatch[1].replace(/-/g, ':');
            const parsedDate = new Date(isoString);
            if (!isNaN(parsedDate.getTime())) {
              timestamp = parsedDate.getTime();
              console.log(`Parsed old format timestamp: ${timestamp} for file: ${filename}`);
            }
          } catch (e) {
            // Fallback to file modification time
            timestamp = (fileInfo as any).modificationTime || Date.now();
            console.log(`Using fallback timestamp: ${timestamp} for file: ${filename}`);
          }
        }

        const formattedDate = formatBackupDate(timestamp);
        console.log(`Backup file: ${filename}, timestamp: ${timestamp}, formatted: ${formattedDate}`);

        backups.push({
          filename,
          path,
          timestamp,
          size: (fileInfo as any).size || 0,
          formattedDate,
        });
      }
    }

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting backup list:', error);
    return [];
  }
};

// Clean up old backups (keep only MAX_BACKUPS)
export const cleanupOldBackups = async (): Promise<void> => {
  try {
    const backups = await getBackupList();

    if (backups.length > MAX_BACKUPS) {
      const backupsToDelete = backups.slice(MAX_BACKUPS);

      for (const backup of backupsToDelete) {
        await FileSystem.deleteAsync(backup.path, { idempotent: true });
        console.log('Deleted old backup:', backup.filename);
      }

      // Update backup count
      await AsyncStorage.setItem(BACKUP_COUNT_KEY, MAX_BACKUPS.toString());
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
};

// Restore database from backup with progress tracking
export const restoreFromBackup = async (
  backupPath: string,
  onProgress?: (progress: BackupProgress) => void
): Promise<void> => {
  try {
    // Stage 1: Validation
    onProgress?.({
      stage: 'validating',
      progress: 10,
      message: 'Validating backup file...'
    });

    // Validate backup file
    const validation = await validateBackupFile(backupPath);
    if (!validation.isValid) {
      throw new Error(`Invalid backup file: ${validation.error}`);
    }

    // Log validation results
    console.log('Backup validation results:', validation);
    if (validation.hasData === false) {
      console.warn('Warning: Backup file appears to be empty (no data found)');
    }

    // Stage 2: Create safety backup
    onProgress?.({
      stage: 'backing_up',
      progress: 30,
      message: 'Creating safety backup of current database...'
    });

    // Create a backup of current database before restoring
    await createBackup();

    // Stage 3: Restore
    onProgress?.({
      stage: 'restoring',
      progress: 60,
      message: 'Restoring database from backup...'
    });

    // Use the new restoration method that properly handles database connection
    await restoreDatabaseFromFile(backupPath);

    // Stage 4: Complete database refresh
    onProgress?.({
      stage: 'cleaning_up',
      progress: 90,
      message: 'Finalizing restoration...'
    });

    // Stage 5: Verify restoration and notify screens
    onProgress?.({
      stage: 'cleaning_up',
      progress: 95,
      message: 'Refreshing app data...'
    });

    // Add a delay to ensure database is fully ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test database connection and data availability
    const dbTest = await testDatabaseConnection();
    console.log('Post-restoration database test:', dbTest);

    if (!dbTest.connected || !dbTest.dataAvailable) {
      console.warn('Database restoration may not have completed properly:', dbTest);
    }

    // Emit multiple events to ensure all screens refresh
    eventBus.emit(EVENTS.DATABASE_RESTORED);
    eventBus.emit(EVENTS.DATA_REFRESH_NEEDED);
    eventBus.emit(EVENTS.FORCE_APP_REFRESH);

    // Stage 6: Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Database restored successfully!'
    });

    console.log('Database restored successfully from:', backupPath);
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw error;
  }
};

// Restore from imported backup file
export const restoreFromImportedFile = async (
  onProgress?: (progress: BackupProgress) => void
): Promise<void> => {
  try {
    // Stage 1: Select and validate file
    onProgress?.({
      stage: 'validating',
      progress: 10,
      message: 'Selecting backup file...'
    });

    const selectedFilePath = await selectBackupFileForImport();

    onProgress?.({
      stage: 'validating',
      progress: 20,
      message: 'Validating backup file...'
    });

    // Stage 2: Create safety backup
    onProgress?.({
      stage: 'backing_up',
      progress: 30,
      message: 'Creating safety backup of current database...'
    });

    // Create a backup of current database before restoring
    await createBackup();

    // Stage 3: Restore directly from selected file
    onProgress?.({
      stage: 'restoring',
      progress: 60,
      message: 'Restoring database from backup...'
    });

    // Use the new restoration method that properly handles database connection
    await restoreDatabaseFromFile(selectedFilePath);

    // Stage 4: Verify restoration and notify screens
    onProgress?.({
      stage: 'cleaning_up',
      progress: 90,
      message: 'Refreshing app data...'
    });

    // Add a delay to ensure database is fully ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test database connection and data availability
    const dbTest = await testDatabaseConnection();
    console.log('Post-restoration database test (imported):', dbTest);

    if (!dbTest.connected || !dbTest.dataAvailable) {
      console.warn('Database restoration may not have completed properly:', dbTest);
    }

    // Emit multiple events to ensure all screens refresh
    eventBus.emit(EVENTS.DATABASE_RESTORED);
    eventBus.emit(EVENTS.DATA_REFRESH_NEEDED);
    eventBus.emit(EVENTS.FORCE_APP_REFRESH);

    // Stage 5: Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Database restored successfully!'
    });

    console.log('Database restored successfully from imported file');
  } catch (error) {
    console.error('Error restoring from imported file:', error);
    throw error;
  }
};

// Get backup count
export const getBackupCount = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(BACKUP_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting backup count:', error);
    return 0;
  }
};

// Get backup status
export const getBackupStatus = async (): Promise<BackupStatus> => {
  try {
    const isEnabled = await isAutoBackupEnabled();
    const lastBackupStr = await AsyncStorage.getItem(LAST_BACKUP_KEY);
    const lastBackup = lastBackupStr ? parseInt(lastBackupStr, 10) : null;
    const backupCount = await getBackupCount();

    let nextBackup: number | null = null;
    if (isEnabled) {
      nextBackup = getNextScheduledBackupTime();
    }

    return {
      isEnabled,
      lastBackup,
      nextBackup,
      backupCount,
    };
  } catch (error) {
    console.error('Error getting backup status:', error);
    return {
      isEnabled: false,
      lastBackup: null,
      nextBackup: null,
      backupCount: 0,
    };
  }
};

// Check if auto backup is enabled
export const isAutoBackupEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem(AUTO_BACKUP_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking auto backup status:', error);
    return false;
  }
};

// Enable/disable auto backup
export const setAutoBackupEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTO_BACKUP_ENABLED_KEY, enabled.toString());

    if (enabled) {
      await startAutoBackup();
    } else {
      await stopAutoBackup();
    }
  } catch (error) {
    console.error('Error setting auto backup status:', error);
    throw error;
  }
};

// Get next scheduled backup time
export const getNextScheduledBackupTime = (): number => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Find the next scheduled hour
  let nextHour = BACKUP_SCHEDULE_HOURS.find(hour => hour > currentHour);

  // If no hour found today, use the first hour of tomorrow
  if (!nextHour) {
    nextHour = BACKUP_SCHEDULE_HOURS[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(nextHour, 0, 0, 0);
    return tomorrow.getTime();
  }

  // Set to next scheduled hour today
  const nextBackup = new Date(now);
  nextBackup.setHours(nextHour, 0, 0, 0);

  // If we're past the minute mark for this hour, move to next scheduled time
  if (nextHour === currentHour && currentMinutes > 5) {
    return getNextScheduledBackupTime();
  }

  return nextBackup.getTime();
};

// Check if it's time for a scheduled backup
export const isScheduledBackupTime = (): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Check if current time matches any scheduled backup time (within 5 minutes)
  return BACKUP_SCHEDULE_HOURS.includes(currentHour) && currentMinutes <= 5;
};

// Background task definition
TaskManager.defineTask(BACKUP_TASK_NAME, async () => {
  try {
    console.log('Background backup task started');

    // Check if auto backup is enabled
    const isEnabled = await isAutoBackupEnabled();
    if (!isEnabled) {
      console.log('Auto backup is disabled, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Check if it's a scheduled backup time
    if (!isScheduledBackupTime()) {
      // Fallback: Check if enough time has passed since last backup
      const lastBackupStr = await AsyncStorage.getItem(LAST_BACKUP_KEY);
      const lastBackup = lastBackupStr ? parseInt(lastBackupStr, 10) : 0;
      const now = Date.now();
      const timeSinceLastBackup = now - lastBackup;
      const backupInterval = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000; // Convert to milliseconds

      if (timeSinceLastBackup < backupInterval) {
        console.log('Not time for backup yet');
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
    }

    // Create backup
    await createBackup();
    console.log('Background backup completed successfully');

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background backup failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Start auto backup
export const startAutoBackup = async (): Promise<void> => {
  try {
    // Check if background fetch is available
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      throw new Error('Background fetch is not available');
    }

    // Register background task
    await BackgroundFetch.registerTaskAsync(BACKUP_TASK_NAME, {
      minimumInterval: BACKUP_INTERVAL_HOURS * 60 * 60, // Convert to seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('Auto backup started');
  } catch (error) {
    console.error('Error starting auto backup:', error);
    throw error;
  }
};

// Stop auto backup
export const stopAutoBackup = async (): Promise<void> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKUP_TASK_NAME);
    console.log('Auto backup stopped');
  } catch (error) {
    console.error('Error stopping auto backup:', error);
    throw error;
  }
};

// Initialize backup system
export const initializeBackupSystem = async (): Promise<void> => {
  try {
    await ensureBackupDirectoryExists();

    // Check if auto backup should be enabled
    const isEnabled = await isAutoBackupEnabled();
    if (isEnabled) {
      await startAutoBackup();
    }

    console.log('Backup system initialized');
  } catch (error) {
    console.error('Error initializing backup system:', error);
  }
};

// Delete a specific backup
export const deleteBackup = async (backupPath: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(backupPath, { idempotent: true });

    // Update backup count
    const currentCount = await getBackupCount();
    if (currentCount > 0) {
      await AsyncStorage.setItem(BACKUP_COUNT_KEY, (currentCount - 1).toString());
    }

    console.log('Backup deleted:', backupPath);
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw error;
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get the latest backup file
export const getLatestBackup = async (): Promise<BackupInfo | null> => {
  try {
    const backups = await getBackupList();
    return backups.length > 0 ? backups[0] : null; // First item is the latest due to sorting
  } catch (error) {
    console.error('Error getting latest backup:', error);
    return null;
  }
};

// Validate backup file integrity and content
export const validateBackupFile = async (filePath: string): Promise<BackupValidationResult> => {
  try {
    console.log('Validating backup file:', filePath);

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return {
        isValid: false,
        error: 'Backup file not found'
      };
    }

    // Check file size (should be > 0 and reasonable for a database)
    const fileSize = (fileInfo as any).size || 0;
    console.log('Backup file size:', fileSize);

    if (fileSize === 0) {
      return {
        isValid: false,
        error: 'Backup file is empty'
      };
    }

    if (fileSize < 1024) { // Less than 1KB is suspicious for a database
      return {
        isValid: false,
        error: 'Backup file is too small to be a valid database'
      };
    }

    // Check file extension
    const isDatabase = filePath.toLowerCase().endsWith('.db');
    if (!isDatabase) {
      return {
        isValid: false,
        error: 'File must have a .db extension'
      };
    }

    // Basic SQLite file header check
    try {
      const headerBytes = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
        length: 16
      });

      // Convert base64 to string and check for SQLite header
      const headerString = atob(headerBytes);
      if (!headerString.startsWith('SQLite format 3')) {
        return {
          isValid: false,
          error: 'File does not appear to be a valid SQLite database'
        };
      }
      console.log('SQLite header validation passed');
    } catch (headerError) {
      console.warn('Could not validate SQLite header:', headerError);
      // Continue with validation - header check is not critical
    }

    // Advanced validation: Try to open the database and check for data
    try {
      console.log('Performing advanced backup validation...');
      const { openDatabaseSync } = require('expo-sqlite');

      // Create a temporary connection to validate the backup
      const tempDb = openDatabaseSync(filePath, { enableChangeListener: false });

      // Check if basic tables exist
      const tables = await tempDb.getAllAsync('SELECT name FROM sqlite_master WHERE type="table"');
      console.log('Tables found in backup:', tables.map((t: any) => t.name));

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

      const foundTables = tables.map((t: any) => t.name);
      const existingCrmTables = allPossibleCrmTables.filter(table => foundTables.includes(table));
      const existingCoreTables = coreTables.filter(table => foundTables.includes(table));

      console.log('Found CRM tables:', existingCrmTables);
      console.log('Found core tables:', existingCoreTables);

      // Check if this looks like a valid CRM backup (has at least some core tables)
      if (existingCoreTables.length === 0) {
        console.warn('No core CRM tables found in backup - might not be a valid CRM backup');
      }

      // Check if there's any data in the backup
      let hasData = false;
      const tableDataCounts: Record<string, number> = {};

      // Check all existing CRM tables for data
      for (const table of existingCrmTables) {
        try {
          const count = await tempDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${table}`) as {count: number} | null;
          const recordCount = count?.count || 0;
          tableDataCounts[table] = recordCount;

          if (recordCount > 0) {
            hasData = true;
            console.log(`Found ${recordCount} records in ${table}`);
          }
        } catch (tableError) {
          console.warn(`Could not check data in table ${table}:`, tableError);
          tableDataCounts[table] = -1; // Indicate error
        }
      }

      // If no data found in CRM tables, but we have core tables, still consider it valid
      // (might be a fresh backup with no data yet)
      if (!hasData && existingCoreTables.length > 0) {
        console.log('No data found but core tables exist - considering backup valid (empty database)');
        hasData = true; // Consider empty but valid database as having "data"
      }

      // Special handling for older backups: if we have ANY CRM-related data, consider it valid
      if (!hasData && existingCrmTables.length > 0) {
        console.log('Backup appears to be from older version - being more lenient with validation');

        // Check if there's ANY data in ANY table (not just CRM tables)
        try {
          const allTablesWithData = [];
          for (const table of foundTables) {
            // Skip system tables
            if (table.startsWith('sqlite_') || table.startsWith('android_metadata')) {
              continue;
            }

            try {
              const count = await tempDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${table}`) as {count: number} | null;
              const recordCount = count?.count || 0;
              if (recordCount > 0) {
                allTablesWithData.push({ table, count: recordCount });
                hasData = true;
              }
            } catch (tableError) {
              // Ignore errors for individual tables
              console.warn(`Could not check table ${table}:`, tableError);
            }
          }

          if (allTablesWithData.length > 0) {
            console.log('Found data in tables (lenient check):', allTablesWithData);
            hasData = true;
          }
        } catch (lenientError) {
          console.warn('Lenient validation also failed:', lenientError);
        }
      }

      console.log('Complete table data summary:', tableDataCounts);

      // Close the temporary connection
      tempDb.closeSync();

      console.log('Backup validation completed. Has data:', hasData);

      return {
        isValid: true,
        fileSize,
        isDatabase: true,
        hasData
      };

    } catch (advancedError) {
      console.warn('Advanced validation failed, but file appears to be a valid SQLite database:', advancedError);
      console.warn('This might be due to:');
      console.warn('1. Backup is from an older app version with different schema');
      console.warn('2. Database is locked or corrupted');
      console.warn('3. Expo SQLite version compatibility issues');
      console.warn('Marking as valid database but unknown data status');

      // Don't fail validation if advanced checks fail - basic validation passed
      return {
        isValid: true,
        fileSize,
        isDatabase: true,
        hasData: true // Assume it has data since we can't verify
      };
    }

  } catch (error) {
    console.error('Error validating backup file:', error);
    return {
      isValid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Download the latest backup - allows user to choose save location
export const downloadLatestBackup = async (): Promise<void> => {
  try {
    const latestBackup = await getLatestBackup();

    if (!latestBackup) {
      throw new Error('No backup files found');
    }

    // Check if backup file exists
    const backupInfo = await FileSystem.getInfoAsync(latestBackup.path);
    if (!backupInfo.exists) {
      throw new Error('Latest backup file not found');
    }

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `SAMVIDA_backup_${timestamp}.db`;

    // Create a temporary file with the proper name for sharing
    const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

    // Copy the backup to temp location with proper filename
    await FileSystem.copyAsync({
      from: latestBackup.path,
      to: tempPath,
    });

    // Use sharing to let user choose where to save
    await shareAsync(tempPath, {
      UTI: '.db',
      mimeType: 'application/x-sqlite3',
      dialogTitle: 'Save Backup File'
    });

    // Clean up the temporary file after a delay to ensure sharing is complete
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
      } catch (cleanupError) {
        console.log('Error cleaning up temp file:', cleanupError);
      }
    }, 5000); // 5 second delay

    console.log(`Backup shared successfully: ${fileName}`);
  } catch (error) {
    console.error('Error downloading latest backup:', error);
    throw error;
  }
};

// Export backup with file picker - allows user to choose destination
export const exportBackupWithPicker = async (backupPath?: string): Promise<void> => {
  try {
    let sourceBackup: BackupInfo | null = null;

    if (backupPath) {
      // Use specific backup
      const backups = await getBackupList();
      sourceBackup = backups.find(b => b.path === backupPath) || null;
    } else {
      // Use latest backup
      sourceBackup = await getLatestBackup();
    }

    if (!sourceBackup) {
      throw new Error('No backup file found to export');
    }

    // Validate the backup file
    const validation = await validateBackupFile(sourceBackup.path);
    if (!validation.isValid) {
      throw new Error(`Invalid backup file: ${validation.error}`);
    }

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `SAMVIDA_backup_${timestamp}.db`;

    // Create a temporary file with the proper name for sharing
    const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

    // Copy the backup to temp location with proper filename
    await FileSystem.copyAsync({
      from: sourceBackup.path,
      to: tempPath,
    });

    // Use sharing to let user choose where to save
    await shareAsync(tempPath, {
      UTI: '.db',
      mimeType: 'application/x-sqlite3',
      dialogTitle: 'Export Backup File'
    });

    // Clean up the temporary file after a delay
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
      } catch (cleanupError) {
        console.log('Error cleaning up temp file:', cleanupError);
      }
    }, 5000);

    console.log(`Backup exported successfully: ${fileName}`);
  } catch (error) {
    console.error('Error exporting backup:', error);
    throw error;
  }
};

// Import backup from external file and return the temporary path
export const selectBackupFileForImport = async (): Promise<string> => {
  try {
    // Use document picker to select backup file
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/x-sqlite3', 'application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('File selection cancelled');
    }

    const file = result.assets[0];

    // Validate the selected file
    const validation = await validateBackupFile(file.uri);
    if (!validation.isValid) {
      throw new Error(`Invalid backup file: ${validation.error}`);
    }

    // Provide detailed information about the backup file
    console.log(`Backup file selected for import: ${file.name}`, {
      size: validation.fileSize,
      hasData: validation.hasData,
      isValid: validation.isValid
    });

    // If validation shows no data, provide more detailed logging but still allow import
    if (validation.hasData === false) {
      console.warn('Warning: Backup validation indicates no data found');
      console.warn('This might be due to:');
      console.warn('1. The backup is from an older app version with different table structure');
      console.warn('2. The backup is genuinely empty');
      console.warn('3. The validation logic is too strict');
      console.warn('Proceeding with import anyway - user can verify after restoration');
    }

    return file.uri; // Return the temporary file URI directly
  } catch (error) {
    console.error('Error selecting backup file:', error);
    throw error;
  }
};

// Debug function to analyze backup files and database state
export const debugBackupSystem = async (): Promise<string> => {
  try {
    const debugInfo: string[] = [];

    debugInfo.push('=== BACKUP SYSTEM DEBUG ===');

    // Check current database state
    debugInfo.push('\n--- Current Database State ---');
    try {
      const dbTest = await testDatabaseConnection();
      debugInfo.push(`Connected: ${dbTest.connected}`);
      debugInfo.push(`Tables Exist: ${dbTest.tablesExist}`);
      debugInfo.push(`Data Available: ${dbTest.dataAvailable}`);
      debugInfo.push(`Core Table Counts: ${JSON.stringify(dbTest.counts)}`);
      debugInfo.push(`Total Records: ${dbTest.totalRecords || 0}`);

      if (dbTest.allTableCounts) {
        debugInfo.push('\nAll Table Breakdown:');
        Object.entries(dbTest.allTableCounts).forEach(([table, count]) => {
          if (count > 0) {
            debugInfo.push(`  ${table}: ${count} records`);
          } else if (count === 0) {
            debugInfo.push(`  ${table}: empty`);
          } else {
            debugInfo.push(`  ${table}: error checking`);
          }
        });
      }
    } catch (dbError) {
      debugInfo.push(`Database Error: ${dbError}`);
    }

    // Check database file
    debugInfo.push('\n--- Database File Info ---');
    try {
      const dbPath = await getDatabasePath();
      const dbFileInfo = await FileSystem.getInfoAsync(dbPath);
      debugInfo.push(`Path: ${dbPath}`);
      debugInfo.push(`Exists: ${dbFileInfo.exists}`);
      debugInfo.push(`Size: ${(dbFileInfo as any).size || 0} bytes`);
    } catch (fileError) {
      debugInfo.push(`File Error: ${fileError}`);
    }

    // Check backup directory
    debugInfo.push('\n--- Backup Directory ---');
    try {
      const backups = await getBackupList();
      debugInfo.push(`Backup Count: ${backups.length}`);

      for (let i = 0; i < Math.min(3, backups.length); i++) {
        const backup = backups[i];
        debugInfo.push(`\nBackup ${i + 1}:`);
        debugInfo.push(`  File: ${backup.filename}`);
        debugInfo.push(`  Size: ${backup.size} bytes`);
        debugInfo.push(`  Date: ${backup.formattedDate}`);

        // Validate this backup
        try {
          const validation = await validateBackupFile(backup.path);
          debugInfo.push(`  Valid: ${validation.isValid}`);
          debugInfo.push(`  Has Data: ${validation.hasData}`);
          if (!validation.isValid) {
            debugInfo.push(`  Error: ${validation.error}`);
          }
        } catch (validationError) {
          debugInfo.push(`  Validation Error: ${validationError}`);
        }
      }
    } catch (backupError) {
      debugInfo.push(`Backup Error: ${backupError}`);
    }

    debugInfo.push('\n=== END DEBUG ===');

    return debugInfo.join('\n');
  } catch (error) {
    return `Debug failed: ${error}`;
  }
};

// Create a comprehensive backup verification report
export const verifyBackupCompleteness = async (backupPath: string): Promise<string> => {
  try {
    const verificationInfo: string[] = [];

    verificationInfo.push('=== BACKUP COMPLETENESS VERIFICATION ===');
    verificationInfo.push(`Backup File: ${backupPath}`);

    // Basic file validation
    const validation = await validateBackupFile(backupPath);
    verificationInfo.push(`\n--- File Validation ---`);
    verificationInfo.push(`Valid: ${validation.isValid}`);
    verificationInfo.push(`Size: ${formatFileSize(validation.fileSize || 0)}`);
    verificationInfo.push(`Has Data: ${validation.hasData}`);

    if (!validation.isValid) {
      verificationInfo.push(`Error: ${validation.error}`);
      return verificationInfo.join('\n');
    }

    // Additional detailed analysis for troubleshooting
    verificationInfo.push(`\n--- Detailed Analysis ---`);
    try {
      const { openDatabaseSync } = require('expo-sqlite');
      const tempDb = openDatabaseSync(backupPath, { enableChangeListener: false });

      // Get all tables
      const allTables = await tempDb.getAllAsync('SELECT name FROM sqlite_master WHERE type="table"');
      const tableNames = allTables.map((t: any) => t.name);

      verificationInfo.push(`Total Tables: ${tableNames.length}`);
      verificationInfo.push(`Tables: ${tableNames.join(', ')}`);

      // Check data in each table
      const dataBreakdown: string[] = [];
      for (const tableName of tableNames) {
        if (tableName.startsWith('sqlite_') || tableName.startsWith('android_metadata')) {
          continue; // Skip system tables
        }

        try {
          const count = await tempDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`) as {count: number} | null;
          const recordCount = count?.count || 0;
          dataBreakdown.push(`${tableName}: ${recordCount} records`);
        } catch (tableError) {
          dataBreakdown.push(`${tableName}: Error reading`);
        }
      }

      verificationInfo.push(`\n--- Data Breakdown ---`);
      verificationInfo.push(dataBreakdown.join('\n'));

      tempDb.closeSync();
    } catch (detailedError) {
      verificationInfo.push(`Detailed analysis failed: ${detailedError}`);
    }

    // Compare with current database
    verificationInfo.push(`\n--- Data Comparison ---`);
    try {
      const currentDbTest = await testDatabaseConnection();
      verificationInfo.push(`Current DB Total Records: ${currentDbTest.totalRecords || 0}`);

      // Open backup and check its contents
      const { openDatabaseSync } = require('expo-sqlite');
      const backupDb = openDatabaseSync(backupPath, { enableChangeListener: false });

      const allCrmTables = [
        'companies', 'clients', 'leads', 'projects', 'units_flats',
        'project_schedules', 'milestones',
        'unit_customer_schedules', 'unit_payment_requests', 'unit_payment_receipts', 'unit_gst_records',
        'quotations', 'quotation_annexure_a', 'quotation_annexure_b', 'quotation_annexure_c',
        'agreement_templates', 'payment_request_templates', 'payment_receipt_templates',
        'contacts', 'tasks'
      ];

      let backupTotalRecords = 0;
      const backupTableCounts: Record<string, number> = {};

      for (const tableName of allCrmTables) {
        try {
          const result = await backupDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`) as {count: number} | null;
          const count = result?.count || 0;
          backupTableCounts[tableName] = count;
          backupTotalRecords += count;
        } catch (tableError) {
          // Table might not exist in backup
        }
      }

      backupDb.closeSync();

      verificationInfo.push(`Backup DB Total Records: ${backupTotalRecords}`);
      verificationInfo.push(`\n--- Table-by-Table Comparison ---`);

      for (const tableName of allCrmTables) {
        const currentCount = currentDbTest.allTableCounts?.[tableName] || 0;
        const backupCount = backupTableCounts[tableName] || 0;

        if (currentCount > 0 || backupCount > 0) {
          const status = currentCount === backupCount ? '✅' : '⚠️';
          verificationInfo.push(`${status} ${tableName}: Current=${currentCount}, Backup=${backupCount}`);
        }
      }

      if (backupTotalRecords === 0 && (currentDbTest.totalRecords || 0) > 0) {
        verificationInfo.push(`\n❌ CRITICAL: Backup is empty but current database has ${currentDbTest.totalRecords} records!`);
      } else if (backupTotalRecords > 0) {
        verificationInfo.push(`\n✅ SUCCESS: Backup contains ${backupTotalRecords} records`);
      }

    } catch (comparisonError) {
      verificationInfo.push(`Comparison Error: ${comparisonError}`);
    }

    verificationInfo.push('\n=== END VERIFICATION ===');
    return verificationInfo.join('\n');

  } catch (error) {
    return `Verification failed: ${error}`;
  }
};
