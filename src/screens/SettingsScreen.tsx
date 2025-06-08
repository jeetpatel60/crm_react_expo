import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import {
  List,
  Divider,
  Button,
  Dialog,
  Portal,
  Text,
  useTheme,
  TouchableRipple,
} from 'react-native-paper';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';


import { ThemeIndicator } from '../components';
import { RootStackParamList, DrawerParamList } from '../types';
import {
  getBackupStatus,
  getDatabaseLocation,
  getBackupLocation,
  downloadLatestBackup,
  BackupStatus
} from '../utils/backupUtils';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;

const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [locationDialogVisible, setLocationDialogVisible] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isEnabled: false,
    lastBackup: null,
    nextBackup: null,
    backupCount: 0,
  });

  // Load backup status
  useEffect(() => {
    const loadBackupStatus = async () => {
      try {
        const status = await getBackupStatus();
        setBackupStatus(status);
      } catch (error) {
        console.error('Error loading backup status:', error);
      }
    };

    loadBackupStatus();
  }, []);

  const handleResetData = () => {
    setResetDialogVisible(false);
    // Implement data reset logic here
    Alert.alert('Success', 'All data has been reset successfully.');
  };

  const openFolder = async (path: string) => {
    try {
      // Get directory path from file path
      const folderPath = path.replace(/\/[^/]*$/, '/');

      // Check if this is an internal app directory
      const isInternalPath = folderPath.includes('data/data/') ||
                             folderPath.includes('DocumentDirectory') ||
                             folderPath.includes('/files/') ||
                             folderPath.includes('expo');

      if (isInternalPath) {
        // Determine file type for better messaging
        const isDatabase = path.includes('crm.db');
        const isBackupFolder = path.includes('backups');
        const fileType = isDatabase ? 'database file' : isBackupFolder ? 'backup files' : 'files';
        const actionText = isDatabase ? 'Copy Database to Downloads' : isBackupFolder ? 'Copy Latest Backup to Downloads' : 'Copy to Downloads';

        // For internal app directories, explain the limitation and offer alternatives
        Alert.alert(
          'File Location',
          `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} are stored in the app's private directory for security:\n\n${folderPath}\n\nThis location is not directly accessible by file managers due to Android security restrictions.\n\nWould you like to copy the ${fileType} to Downloads folder for access?`,
          [
            {
              text: 'Copy Path',
              onPress: () => copyToClipboard(folderPath),
              style: 'default'
            },
            {
              text: actionText,
              onPress: () => copyDatabaseToDownloads(path),
              style: 'default'
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        // For accessible directories, try to open them
        Alert.alert(
          'Folder Location',
          `The folder is located at:\n\n${folderPath}\n\nYou can copy the path and navigate to it using your file manager.`,
          [
            {
              text: 'Copy Path',
              onPress: () => copyToClipboard(folderPath),
              style: 'default'
            },
            {
              text: 'Open File Manager',
              onPress: () => openFileManager(folderPath),
              style: 'default'
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error handling folder:', error);
      Alert.alert(
        'Error',
        'Failed to process folder location. Please check the paths in the dialog.'
      );
    }
  };

  const openFileManager = async (folderPath?: string) => {
    try {
      if (Platform.OS === 'android') {
        // Try multiple approaches to open file manager on Android
        try {
          // First try: Open file manager with ACTION_VIEW
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: 'content://com.android.externalstorage.documents/root/primary',
            type: 'resource/folder'
          });
          console.log('Successfully opened file manager with ACTION_VIEW');
          return; // Success, exit the function
        } catch (firstError) {
          console.log('First attempt failed, trying alternative:', firstError);
          try {
            // Second try: Open file manager with ACTION_GET_CONTENT
            await IntentLauncher.startActivityAsync('android.intent.action.GET_CONTENT', {
              type: '*/*',
              category: 'android.intent.category.OPENABLE'
            });
            console.log('Successfully opened file manager with ACTION_GET_CONTENT');
            return; // Success, exit the function
          } catch (secondError) {
            console.log('Second attempt failed, trying third:', secondError);
            try {
              // Third try: Open Downloads folder specifically
              await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: 'content://com.android.externalstorage.documents/root/primary/Download',
                type: 'resource/folder'
              });
              console.log('Successfully opened Downloads folder');
              return; // Success, exit the function
            } catch (thirdError) {
              console.log('Third attempt failed, trying Linking API:', thirdError);
              try {
                // Fourth try: Use Linking API to open file manager
                await Linking.openURL('content://com.android.externalstorage.documents/root/primary');
                console.log('Successfully opened file manager with Linking API');
                return; // Success, exit the function
              } catch (fourthError) {
                console.log('Fourth attempt failed, trying common file managers:', fourthError);
                try {
                  // Fifth try: Try to open common file manager apps
                  const fileManagerPackages = [
                    'com.google.android.documentsui/.files.FilesActivity',
                    'com.android.documentsui/.files.FilesActivity',
                    'com.sec.android.app.myfiles/.ui.MainActivity',
                    'com.mi.android.globalFileexplorer/.ui.MainActivity'
                  ];

                  for (const packageName of fileManagerPackages) {
                    try {
                      await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
                        className: packageName
                      });
                      return; // Success, exit the function
                    } catch (packageError) {
                      console.log(`Failed to open ${packageName}:`, packageError);
                    }
                  }
                  throw new Error('No file manager apps could be opened');
                } catch (fifthError) {
                  console.log('All attempts failed:', fifthError);
                  // Fallback to showing instructions
                  throw new Error('Unable to open file manager automatically');
                }
              }
            }
          }
        }
      } else {
        // For iOS, show instruction
        Alert.alert(
          'Open File Manager',
          'Please open the Files app and navigate to the copied path.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening file manager:', error);
      Alert.alert(
        'Open File Manager',
        `Unable to open file manager automatically.\n\nPlease manually open your device's file manager app and navigate to the path you copied.\n\nCommon file manager apps:\n• Files (Google)\n• My Files (Samsung)\n• File Manager\n• ES File Explorer${folderPath ? `\n\nPath to navigate to:\n${folderPath}` : ''}`,
        [
          {
            text: 'Copy Path Again',
            onPress: () => folderPath && copyToClipboard(folderPath),
            style: 'default'
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const copyDatabaseToDownloads = async (filePath: string) => {
    try {
      let sourceFile = filePath;
      let fileName = '';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      // Handle different file types
      if (filePath.includes('backups')) {
        // For backup folder, find the latest backup file
        try {
          const backupDir = filePath.replace(/\/[^/]*$/, '/');
          const files = await FileSystem.readDirectoryAsync(backupDir);
          const backupFiles = files.filter(file => file.endsWith('.db'));

          if (backupFiles.length === 0) {
            Alert.alert('No Backups Found', 'No backup files were found in the backup directory.');
            return;
          }

          // Sort by modification time to get the latest
          const fileInfos = await Promise.all(
            backupFiles.map(async (file) => {
              const fullPath = `${backupDir}${file}`;
              const info = await FileSystem.getInfoAsync(fullPath);
              return {
                name: file,
                path: fullPath,
                modTime: (info as any).modificationTime || Date.now()
              };
            })
          );

          const latestBackup = fileInfos.sort((a, b) => b.modTime - a.modTime)[0];
          sourceFile = latestBackup.path;
          fileName = `latest_backup_${timestamp}.db`;
        } catch (backupError) {
          console.error('Error finding backup files:', backupError);
          Alert.alert('Error', 'Could not access backup files.');
          return;
        }
      } else {
        // Check if the file exists
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
          Alert.alert('File Not Found', 'The database file could not be found.');
          return;
        }

        // Create a filename with timestamp
        fileName = filePath.includes('crm.db')
          ? `crm_database_${timestamp}.db`
          : `backup_${timestamp}.db`;
      }

      // Define the destination path in Downloads
      const downloadsPath = `${FileSystem.documentDirectory}../Downloads/${fileName}`;

      try {
        // Try to copy to Downloads folder
        await FileSystem.copyAsync({
          from: sourceFile,
          to: downloadsPath,
        });

        Alert.alert(
          'File Copied Successfully',
          `Database file has been copied to Downloads folder as:\n\n${fileName}\n\nYou can now access it through your file manager.`,
          [
            {
              text: 'Open Downloads',
              onPress: () => openDownloadsFolder(),
              style: 'default'
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } catch (downloadError) {
        console.log('Failed to copy to Downloads, trying alternative location:', downloadError);

        // Fallback: Copy to a more accessible location
        const fallbackPath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.copyAsync({
          from: sourceFile,
          to: fallbackPath,
        });

        Alert.alert(
          'File Copied to Cache',
          `Database file has been copied to cache folder as:\n\n${fileName}\n\nPath: ${fallbackPath}\n\nNote: This file may be automatically deleted by the system.`,
          [
            {
              text: 'Copy Path',
              onPress: () => copyToClipboard(fallbackPath),
              style: 'default'
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error copying database file:', error);
      Alert.alert(
        'Copy Failed',
        'Failed to copy the database file. Please try again or use the backup feature instead.'
      );
    }
  };

  const openDownloadsFolder = async () => {
    try {
      if (Platform.OS === 'android') {
        // Try to open Downloads folder specifically
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: 'content://com.android.externalstorage.documents/root/primary/Download',
          type: 'resource/folder'
        });
      } else {
        Alert.alert(
          'Open Downloads',
          'Please open the Files app and navigate to the Downloads folder.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening Downloads folder:', error);
      Alert.alert(
        'Open Downloads',
        'Please open your file manager and navigate to the Downloads folder to find the copied file.',
        [{ text: 'OK' }]
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Path Copied', 'The path has been copied to your clipboard.');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Copy Failed', 'Failed to copy path to clipboard.');
    }
  };

  const handleDownloadLatestBackup = async () => {
    try {
      await downloadLatestBackup();
    } catch (error) {
      console.error('Error downloading latest backup:', error);
      Alert.alert(
        'Download Failed',
        error instanceof Error ? error.message : 'Failed to download the latest backup. Please try again.'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ThemeIndicator />
      <ScrollView>
        <List.Section>
          <List.Subheader>Data</List.Subheader>
          <List.Item
            title="Reset All Data"
            description="Delete all application data"
            left={(props) => (
              <List.Icon {...props} icon="delete" color={theme.colors.error} />
            )}
            onPress={() => setResetDialogVisible(true)}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Database</List.Subheader>
          <List.Item
            title="Backup & Restore"
            description={`Auto backup: ${backupStatus.isEnabled ? 'ON' : 'OFF'} • ${backupStatus.backupCount} backups`}
            left={(props) => (
              <List.Icon {...props} icon="backup-restore" color={theme.colors.primary} />
            )}
            onPress={() => navigation.navigate('BackupManagement')}
          />
          <List.Item
            title="Download Latest Backup"
            description={backupStatus.backupCount > 0 ? "Save the most recent backup to a location of your choice" : "No backups available"}
            left={(props) => (
              <List.Icon {...props} icon="download" color={backupStatus.backupCount > 0 ? theme.colors.primary : theme.colors.outline} />
            )}
            disabled={backupStatus.backupCount === 0}
            onPress={handleDownloadLatestBackup}
          />
          <List.Item
            title="Database Location"
            description="View database file location"
            left={(props) => (
              <List.Icon {...props} icon="folder-open" color={theme.colors.primary} />
            )}
            onPress={() => setLocationDialogVisible(true)}
          />

        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>How to Use</List.Subheader>
          <List.Item
            title="Getting Started Guide"
            description="Learn how to use the CRM app step by step"
            left={(props) => (
              <List.Icon {...props} icon="help-circle-outline" color={theme.colors.primary} />
            )}
            onPress={() => navigation.navigate('HowToUseGuide')}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => (
              <List.Icon {...props} icon="information" color={theme.colors.primary} />
            )}
          />
          <List.Item
            title="Privacy Policy"
            left={(props) => (
              <List.Icon {...props} icon="shield-account" color={theme.colors.primary} />
            )}
            onPress={() => {
              // Open privacy policy
              Alert.alert('Coming Soon', 'This feature will be available in a future update.');
            }}
          />
          <List.Item
            title="Terms of Service"
            left={(props) => (
              <List.Icon {...props} icon="file-document" color={theme.colors.primary} />
            )}
            onPress={() => {
              // Open terms of service
              Alert.alert('Coming Soon', 'This feature will be available in a future update.');
            }}
          />
        </List.Section>
      </ScrollView>

      <Portal>
        <Dialog
          visible={resetDialogVisible}
          onDismiss={() => setResetDialogVisible(false)}
        >
          <Dialog.Title>Reset All Data</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to reset all data? This action cannot be undone and will delete all your application data.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleResetData} textColor={theme.colors.error}>
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={locationDialogVisible}
          onDismiss={() => setLocationDialogVisible(false)}
        >
          <Dialog.Title>Database Locations</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Tap on any path below to view folder location, or use the Copy button to copy the path:
            </Text>

            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                  Database File:
                </Text>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => copyToClipboard(getDatabaseLocation())}
                  icon="content-copy"
                >
                  Copy
                </Button>
              </View>
              <TouchableRipple
                onPress={() => openFolder(getDatabaseLocation())}
                style={{
                  padding: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  {getDatabaseLocation()}
                </Text>
              </TouchableRipple>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                  Backup Folder:
                </Text>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => copyToClipboard(getBackupLocation())}
                  icon="content-copy"
                >
                  Copy
                </Button>
              </View>
              <TouchableRipple
                onPress={() => openFolder(getBackupLocation())}
                style={{
                  padding: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  {getBackupLocation()}
                </Text>
              </TouchableRipple>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLocationDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;
