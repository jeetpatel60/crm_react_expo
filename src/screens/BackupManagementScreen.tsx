import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Switch,
  Dialog,
  Portal,
  useTheme,
  ActivityIndicator,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { spacing, shadows } from '../constants/theme';
import { eventBus, EVENTS } from '../utils/eventBus';
import { testDatabaseConnection } from '../database/database';
import {
  BackupInfo,
  BackupStatus,
  BackupProgress,
  createBackup,
  getBackupList,
  getBackupStatus,
  setAutoBackupEnabled,
  restoreFromBackup,
  restoreFromImportedFile,
  deleteBackup,
  exportBackupWithPicker,
  getDatabaseLocation,
  getBackupLocation,
  formatFileSize,
  formatBackupDate,
  debugBackupSystem,
  verifyBackupCompleteness,
} from '../utils/backupUtils';

type BackupManagementScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BackupManagementScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<BackupManagementScreenNavigationProp>();

  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isEnabled: false,
    lastBackup: null,
    nextBackup: null,
    backupCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<BackupProgress | null>(null);
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [importRestoreDialogVisible, setImportRestoreDialogVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [databaseLocation, setDatabaseLocation] = useState<string>('Loading...');

  useEffect(() => {
    loadData();

    // Listen for database restoration events
    const unsubscribe = eventBus.on(EVENTS.DATABASE_RESTORED, () => {
      console.log('Database restored, refreshing backup management screen');
      loadData();
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [backupList, status, dbLocation] = await Promise.all([
        getBackupList(),
        getBackupStatus(),
        getDatabaseLocation(),
      ]);
      setBackups(backupList);
      setBackupStatus(status);
      setDatabaseLocation(dbLocation);
    } catch (error) {
      console.error('Error loading backup data:', error);
      Alert.alert('Error', 'Failed to load backup data');
      setDatabaseLocation('Error loading location');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      await createBackup();
      Alert.alert('Success', 'Backup created successfully');
      await loadData();
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAutoBackup = async (enabled: boolean) => {
    try {
      await setAutoBackupEnabled(enabled);
      await loadData();
      Alert.alert(
        'Success',
        enabled ? 'Auto backup enabled' : 'Auto backup disabled'
      );
    } catch (error) {
      console.error('Error toggling auto backup:', error);
      Alert.alert('Error', 'Failed to update auto backup setting');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setRestoring(true);
      setRestoreProgress(null);

      await restoreFromBackup(selectedBackup.path, (progress) => {
        setRestoreProgress(progress);
      });

      setRestoreDialogVisible(false);
      setSelectedBackup(null);
      setRestoreProgress(null);

      // Test database after restoration
      setTimeout(async () => {
        const dbTest = await testDatabaseConnection();
        console.log('Database test after restore:', dbTest);

        // Show detailed results regardless of whether validation detected data
        const totalRecords = dbTest.counts.clients + dbTest.counts.projects + dbTest.counts.units + dbTest.counts.leads;

        if (totalRecords > 0) {
          Alert.alert(
            '✅ Restore Successful!',
            `Your data has been restored successfully!\n\n📊 Restored Data:\n• ${dbTest.counts.clients} Clients\n• ${dbTest.counts.projects} Projects\n• ${dbTest.counts.units} Units/Flats\n• ${dbTest.counts.leads} Leads\n\n💡 The app will refresh automatically. Navigate to different screens to see your restored data.`,
            [
              {
                text: 'View Data',
                onPress: () => {
                  // Force reload data after user acknowledges
                  setTimeout(() => {
                    loadData();
                  }, 500);
                }
              }
            ]
          );
        } else {
          Alert.alert(
            '✅ Restore Complete!',
            `The backup has been restored successfully!\n\n📊 Current Data Status:\n• ${dbTest.counts.clients} Clients\n• ${dbTest.counts.projects} Projects\n• ${dbTest.counts.units} Units/Flats\n• ${dbTest.counts.leads} Leads\n\n💡 If you expected more data, the backup might be from an older app version or might be empty. The restoration was successful - you can now add new data or try a different backup.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Force reload data after user acknowledges
                  setTimeout(() => {
                    loadData();
                  }, 500);
                }
              }
            ]
          );
        }
      }, 1000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('Error', `Failed to restore backup: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRestoring(false);
      setRestoreProgress(null);
    }
  };

  const handleExportBackup = async (backup?: BackupInfo) => {
    try {
      setExporting(true);
      await exportBackupWithPicker(backup?.path);
      Alert.alert('Success', 'Backup exported successfully');
    } catch (error) {
      console.error('Error exporting backup:', error);
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        Alert.alert('Error', `Failed to export backup: ${error.message}`);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImportAndRestore = async () => {
    try {
      setImporting(true);
      setRestoreProgress(null);

      await restoreFromImportedFile((progress) => {
        setRestoreProgress(progress);
      });

      setImportRestoreDialogVisible(false);
      setRestoreProgress(null);

      // Test database after restoration
      setTimeout(async () => {
        const dbTest = await testDatabaseConnection();
        console.log('Database test after import/restore:', dbTest);

        // Show detailed results regardless of whether validation detected data
        const totalRecords = dbTest.counts.clients + dbTest.counts.projects + dbTest.counts.units + dbTest.counts.leads;

        if (totalRecords > 0) {
          Alert.alert(
            '🎉 Import & Restore Complete!',
            `Your backup file has been imported and restored successfully!\n\n📊 Imported Data:\n• ${dbTest.counts.clients} Clients\n• ${dbTest.counts.projects} Projects\n• ${dbTest.counts.units} Units/Flats\n• ${dbTest.counts.leads} Leads\n\n🔄 Perfect for Case 1: Phone reset or new device setup is now complete!`,
            [
              {
                text: 'Explore Data',
                onPress: () => {
                  // Force reload data after user acknowledges
                  setTimeout(() => {
                    loadData();
                  }, 500);
                }
              }
            ]
          );
        } else {
          Alert.alert(
            '✅ Import & Restore Complete!',
            `Your backup file has been imported and restored successfully!\n\n📊 Current Data Status:\n• ${dbTest.counts.clients} Clients\n• ${dbTest.counts.projects} Projects\n• ${dbTest.counts.units} Units/Flats\n• ${dbTest.counts.leads} Leads\n\n💡 If you expected more data, the backup might be from an older app version. The restoration was successful - you can now add new data or try a different backup file.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Force reload data after user acknowledges
                  setTimeout(() => {
                    loadData();
                  }, 500);
                }
              }
            ]
          );
        }
      }, 1000);

    } catch (error) {
      console.error('Error importing and restoring backup:', error);
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        Alert.alert('Error', `Failed to import backup: ${error.message}`);
      }
    } finally {
      setImporting(false);
      setRestoreProgress(null);
    }
  };

  const handleTestDatabase = async () => {
    try {
      setTesting(true);
      const dbTest = await testDatabaseConnection();

      Alert.alert(
        'Database Test Results',
        `Connected: ${dbTest.connected ? 'Yes' : 'No'}\n` +
        `Tables Exist: ${dbTest.tablesExist ? 'Yes' : 'No'}\n` +
        `Data Available: ${dbTest.dataAvailable ? 'Yes' : 'No'}\n\n` +
        `Data Counts:\n` +
        `• Clients: ${dbTest.counts.clients}\n` +
        `• Projects: ${dbTest.counts.projects}\n` +
        `• Units/Flats: ${dbTest.counts.units}\n` +
        `• Leads: ${dbTest.counts.leads}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to test database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTesting(false);
    }
  };

  const handleDebugSystem = async () => {
    try {
      setDebugging(true);
      const debugInfo = await debugBackupSystem();

      Alert.alert(
        'Backup System Debug',
        debugInfo,
        [
          { text: 'Copy to Console', onPress: () => console.log(debugInfo) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to debug system: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDebugging(false);
    }
  };

  const handleVerifyBackup = async (backup: BackupInfo) => {
    try {
      setVerifying(true);
      const verificationReport = await verifyBackupCompleteness(backup.path);

      Alert.alert(
        'Backup Verification Report',
        verificationReport,
        [
          { text: 'Copy to Console', onPress: () => console.log(verificationReport) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to verify backup: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      await deleteBackup(selectedBackup.path);
      setDeleteDialogVisible(false);
      setSelectedBackup(null);
      await loadData();
      Alert.alert('Success', 'Backup deleted successfully');
    } catch (error) {
      console.error('Error deleting backup:', error);
      Alert.alert('Error', 'Failed to delete backup');
    }
  };

  const showRestoreDialog = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setRestoreDialogVisible(true);
  };

  const showDeleteDialog = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setDeleteDialogVisible(true);
  };

  const formatDate = (timestamp: number) => {
    return formatBackupDate(timestamp);
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const getStatusColor = () => {
    if (backupStatus.isEnabled) {
      return theme.colors.primary;
    }
    return theme.colors.outline;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading backup data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Quick Guide Card */}
        <Card style={[styles.card, shadows.md, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onPrimaryContainer }]}>
              📖 Complete Data Protection
            </Text>
            <Text variant="bodyMedium" style={[styles.cardDescription, { color: theme.colors.onPrimaryContainer }]}>
              <Text style={{ fontWeight: 'bold' }}>✅ ALL Data Backed Up:</Text> Companies, Clients, Projects, Units, Leads, Schedules, Payments, Quotations, Templates, and more
              {'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>Case 1 - Phone Reset:</Text> Export → Reset → Import & restore
              {'\n'}
              <Text style={{ fontWeight: 'bold' }}>Case 2 - Recover Data:</Text> Choose backup → Restore
            </Text>
          </Card.Content>
        </Card>

        {/* Status Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Backup Status
            </Text>
            <View style={styles.statusRow}>
              <Chip
                icon={backupStatus.isEnabled ? 'check-circle' : 'alert-circle'}
                style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
                textStyle={{ color: theme.colors.onPrimary }}
              >
                {backupStatus.isEnabled ? 'Auto Backup ON' : 'Auto Backup OFF'}
              </Chip>
            </View>

            {backupStatus.lastBackup && (
              <Text variant="bodyMedium" style={styles.statusText}>
                Last backup: {formatDate(backupStatus.lastBackup)}
              </Text>
            )}

            {backupStatus.nextBackup && backupStatus.isEnabled && (
              <Text variant="bodyMedium" style={styles.statusText}>
                Next backup: {formatDate(backupStatus.nextBackup)}
              </Text>
            )}

            <Text variant="bodyMedium" style={styles.statusText}>
              Total backups: {backupStatus.backupCount}
            </Text>
          </Card.Content>
        </Card>

        {/* Auto Backup Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Automatic Backup
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Automatically creates backups 5 times daily to protect your data
            </Text>

            <List.Item
              title="Auto Backup"
              description="Daily backups at: 6 AM, 10 AM, 2 PM, 6 PM, 10 PM"
              left={(props) => (
                <List.Icon {...props} icon="backup-restore" color={theme.colors.primary} />
              )}
              right={() => (
                <Switch
                  value={backupStatus.isEnabled}
                  onValueChange={handleToggleAutoBackup}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Manual Backup Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Manual Backup
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Create and export backups manually for extra security
            </Text>

            <Button
              mode="contained"
              onPress={handleCreateBackup}
              loading={creating}
              disabled={creating}
              style={styles.button}
              icon="content-save"
            >
              Create Backup Now
            </Button>

            <Button
              mode="outlined"
              onPress={() => handleExportBackup()}
              loading={exporting}
              disabled={exporting || backups.length === 0}
              style={styles.button}
              icon="export"
            >
              Export Latest Backup
            </Button>
          </Card.Content>
        </Card>

        {/* Restore Data Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Restore Data
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Restore your data from automatic backups or imported files
            </Text>

            <Button
              mode="contained-tonal"
              onPress={() => setImportRestoreDialogVisible(true)}
              loading={importing}
              disabled={importing}
              style={styles.button}
              icon="import"
            >
              Import & Restore from File
            </Button>

            <Text variant="bodySmall" style={styles.restoreNote}>
              💡 You can also restore from any automatic backup listed below
            </Text>
          </Card.Content>
        </Card>

        {/* Diagnostics Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Diagnostics
            </Text>

            <Button
              mode="text"
              onPress={handleTestDatabase}
              loading={testing}
              disabled={testing}
              style={styles.button}
              icon="database-check"
            >
              Test Database Connection
            </Button>

            <Button
              mode="text"
              onPress={handleDebugSystem}
              loading={debugging}
              disabled={debugging}
              style={styles.button}
              icon="bug-check"
            >
              Debug Backup System
            </Button>
          </Card.Content>
        </Card>

        {/* Database Location Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              File Locations
            </Text>

            <List.Item
              title="Database Location"
              description={databaseLocation}
              left={(props) => (
                <List.Icon {...props} icon="database" color={theme.colors.primary} />
              )}
            />

            <List.Item
              title="Backup Location"
              description={getBackupLocation()}
              left={(props) => (
                <List.Icon {...props} icon="folder" color={theme.colors.primary} />
              )}
            />
          </Card.Content>
        </Card>

        {/* Backup List Header */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Available Backups ({backups.length})
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Tap "Restore" on any backup to replace your current data
          </Text>
        </View>

        {backups.length === 0 ? (
          <Card style={[styles.card, shadows.md]}>
            <Card.Content>
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="backup-restore"
                  size={48}
                  color={theme.colors.outline}
                  style={styles.emptyIcon}
                />
                <Text variant="bodyLarge" style={styles.emptyTitle}>
                  No Backups Available
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Create your first backup using the button above to get started.
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          backups.map((backup, index) => (
            <Card key={backup.filename} style={[styles.backupCard, shadows.sm]}>
              <Card.Content style={styles.backupCardContent}>
                {/* Header Row */}
                <View style={styles.backupHeader}>
                  <View style={styles.backupIconContainer}>
                    <MaterialCommunityIcons
                      name="database"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.backupInfo}>
                    <Text variant="titleSmall" style={styles.backupTitle} numberOfLines={1}>
                      Backup #{backups.length - index}
                    </Text>
                    <Text variant="bodySmall" style={styles.backupSubtitle}>
                      {backup.formattedDate}
                    </Text>
                  </View>
                  <View style={styles.backupSize}>
                    <Text variant="bodySmall" style={styles.sizeText}>
                      {formatFileSize(backup.size)}
                    </Text>
                    <Text variant="bodySmall" style={styles.timeAgoText}>
                      {getTimeAgo(backup.timestamp)}
                    </Text>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.backupDetails}>
                  <Text variant="bodySmall" style={styles.filenameText} numberOfLines={1}>
                    {backup.filename}
                  </Text>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.backupActions}>
                  <Button
                    mode="contained-tonal"
                    compact
                    onPress={() => showRestoreDialog(backup)}
                    style={styles.actionButton}
                    icon="restore"
                  >
                    Restore
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => handleExportBackup(backup)}
                    style={styles.actionButton}
                    icon="export"
                    loading={exporting}
                    disabled={exporting}
                  >
                    Export
                  </Button>
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleVerifyBackup(backup)}
                    style={styles.actionButton}
                    icon="check-circle-outline"
                    loading={verifying}
                    disabled={verifying}
                  >
                    Verify
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => showDeleteDialog(backup)}
                    style={styles.actionButton}
                    textColor={theme.colors.error}
                    icon="delete-outline"
                  >
                    Delete
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Restore Dialog */}
      <Portal>
        <Dialog
          visible={restoreDialogVisible}
          onDismiss={() => setRestoreDialogVisible(false)}
        >
          <Dialog.Title>Restore from Automatic Backup</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              <Text style={{ fontWeight: 'bold' }}>Use Case 2: Restore from Automatic Backup</Text>
              {'\n'}Perfect for recovering data from our automatic backup system.
              {'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>This will:</Text>
              {'\n'}• Create a safety backup of your current data
              {'\n'}• Replace all current data with this backup
              {'\n'}• Refresh the app to show the restored data
              {'\n\n'}
              <Text style={{ fontWeight: 'bold', color: theme.colors.error }}>
                ⚠️ All current data will be replaced with the backup data.
              </Text>
            </Text>
            {selectedBackup && (
              <View style={styles.dialogBackupInfo}>
                <Text variant="labelMedium" style={styles.dialogLabel}>Backup Details:</Text>
                <Text variant="bodySmall" style={styles.dialogDetail}>
                  📅 Date: {selectedBackup.formattedDate}
                </Text>
                <Text variant="bodySmall" style={styles.dialogDetail}>
                  📦 Size: {formatFileSize(selectedBackup.size)}
                </Text>
                <Text variant="bodySmall" style={styles.dialogDetail}>
                  📄 File: {selectedBackup.filename}
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRestoreDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleRestoreBackup}
              mode="contained"
              loading={restoring}
              disabled={restoring}
            >
              Restore Data
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Backup</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this backup?
              {'\n\n'}
              This action cannot be undone.
            </Text>
            {selectedBackup && (
              <View style={styles.dialogBackupInfo}>
                <Text variant="labelMedium" style={styles.dialogLabel}>Backup Details:</Text>
                <Text variant="bodySmall" style={styles.dialogDetail}>
                  Date: {selectedBackup.formattedDate}
                </Text>
                <Text variant="bodySmall" style={styles.dialogDetail}>
                  Size: {formatFileSize(selectedBackup.size)}
                </Text>
                <Text variant="bodySmall" style={styles.dialogDetail}>
                  File: {selectedBackup.filename}
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteBackup} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Import and Restore Confirmation Dialog */}
      <Portal>
        <Dialog visible={importRestoreDialogVisible} onDismiss={() => setImportRestoreDialogVisible(false)}>
          <Dialog.Title>Import & Restore from File</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              <Text style={{ fontWeight: 'bold' }}>Use Case 1: Restore from Exported Backup</Text>
              {'\n'}Perfect for when you've reset your phone or installed the app on a new device.
              {'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>This process will:</Text>
              {'\n'}• Let you select a backup file (.db) from your device
              {'\n'}• Create a safety backup of your current data
              {'\n'}• Replace all current data with the imported backup
              {'\n'}• Refresh the app to show the restored data
              {'\n\n'}
              <Text style={{ fontWeight: 'bold', color: theme.colors.error }}>
                ⚠️ Warning: All current data will be replaced with the backup data.
              </Text>
              {'\n\n'}
              <Text style={{ color: theme.colors.primary }}>
                💡 Tip: Your current data will be safely backed up before restoration.
              </Text>
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setImportRestoreDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleImportAndRestore}
              mode="contained"
              loading={importing}
              disabled={importing}
            >
              Select File & Restore
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Progress Dialog */}
      <Portal>
        <Dialog visible={!!restoreProgress} dismissable={false}>
          <Dialog.Title>
            {restoreProgress?.stage === 'validating' && 'Validating Backup'}
            {restoreProgress?.stage === 'backing_up' && 'Creating Safety Backup'}
            {restoreProgress?.stage === 'restoring' && 'Restoring Database'}
            {restoreProgress?.stage === 'cleaning_up' && 'Cleaning Up'}
            {restoreProgress?.stage === 'complete' && 'Complete'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.progressText}>
              {restoreProgress?.message}
            </Text>
            <ProgressBar
              progress={(restoreProgress?.progress || 0) / 100}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressPercentage}>
              {Math.round(restoreProgress?.progress || 0)}%
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  cardDescription: {
    marginBottom: spacing.md,
    color: '#666',
    lineHeight: 20,
  },
  restoreNote: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusChip: {
    marginRight: spacing.sm,
  },
  statusText: {
    marginBottom: spacing.xs,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  halfButton: {
    flex: 0.48,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  progressText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  progressBar: {
    marginBottom: spacing.sm,
    height: 8,
  },
  progressPercentage: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Section Header Styles
  sectionHeader: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#666',
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    color: '#888',
    fontStyle: 'italic',
  },
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  // Backup Card Styles
  backupCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  backupCardContent: {
    paddingVertical: spacing.md,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  backupInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  backupTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  backupSubtitle: {
    color: '#666',
  },
  backupSize: {
    alignItems: 'flex-end',
  },
  sizeText: {
    fontWeight: '500',
    color: '#666',
  },
  timeAgoText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  backupDetails: {
    marginBottom: spacing.md,
    paddingLeft: 56, // Align with icon + margin
  },
  filenameText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#888',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
  },
  backupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 56, // Align with icon + margin
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
  // Dialog Styles
  dialogBackupInfo: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6750a4',
  },
  dialogLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: '#6750a4',
  },
  dialogDetail: {
    marginBottom: 4,
    color: '#666',
  },
});

export default BackupManagementScreen;
