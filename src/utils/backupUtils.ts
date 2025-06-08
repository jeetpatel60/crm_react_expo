import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { shareAsync } from 'expo-sharing';

// Constants
export const BACKUP_TASK_NAME = 'database-backup-task';
export const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
export const DATABASE_PATH = `${FileSystem.documentDirectory}SQLite/crm.db`;
export const MAX_BACKUPS = 5;
export const BACKUP_INTERVAL_HOURS = 2;

// Storage keys
const LAST_BACKUP_KEY = 'last_backup_timestamp';
const AUTO_BACKUP_ENABLED_KEY = 'auto_backup_enabled';
const BACKUP_COUNT_KEY = 'backup_count';

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
export const getDatabaseLocation = (): string => {
  return DATABASE_PATH;
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

    // Check if database file exists
    const dbInfo = await FileSystem.getInfoAsync(DATABASE_PATH);
    if (!dbInfo.exists) {
      throw new Error('Database file not found');
    }

    const filename = generateBackupFilename();
    const backupPath = `${BACKUP_DIR}${filename}`;

    console.log(`Creating backup with filename: ${filename}`);

    // Copy database file to backup location
    await FileSystem.copyAsync({
      from: DATABASE_PATH,
      to: backupPath,
    });

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

// Restore database from backup
export const restoreFromBackup = async (backupPath: string): Promise<void> => {
  try {
    // Check if backup file exists
    const backupInfo = await FileSystem.getInfoAsync(backupPath);
    if (!backupInfo.exists) {
      throw new Error('Backup file not found');
    }

    // Create a backup of current database before restoring
    await createBackup();

    // Copy backup file to database location
    await FileSystem.copyAsync({
      from: backupPath,
      to: DATABASE_PATH,
    });

    console.log('Database restored successfully from:', backupPath);
  } catch (error) {
    console.error('Error restoring from backup:', error);
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
    if (isEnabled && lastBackup) {
      nextBackup = lastBackup + (BACKUP_INTERVAL_HOURS * 60 * 60 * 1000);
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

    // Check if it's time for backup
    const lastBackupStr = await AsyncStorage.getItem(LAST_BACKUP_KEY);
    const lastBackup = lastBackupStr ? parseInt(lastBackupStr, 10) : 0;
    const now = Date.now();
    const timeSinceLastBackup = now - lastBackup;
    const backupInterval = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000; // Convert to milliseconds

    if (timeSinceLastBackup < backupInterval) {
      console.log('Not time for backup yet');
      return BackgroundFetch.BackgroundFetchResult.NoData;
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
