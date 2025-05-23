import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Switch,
  Divider,
  Dialog,
  Portal,
  useTheme,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { spacing, shadows } from '../constants/theme';
import {
  BackupInfo,
  BackupStatus,
  createBackup,
  getBackupList,
  getBackupStatus,
  setAutoBackupEnabled,
  restoreFromBackup,
  deleteBackup,
  getDatabaseLocation,
  getBackupLocation,
  formatFileSize,
  formatBackupDate,
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
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [backupList, status] = await Promise.all([
        getBackupList(),
        getBackupStatus(),
      ]);
      setBackups(backupList);
      setBackupStatus(status);
    } catch (error) {
      console.error('Error loading backup data:', error);
      Alert.alert('Error', 'Failed to load backup data');
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
      await restoreFromBackup(selectedBackup.path);
      setRestoreDialogVisible(false);
      setSelectedBackup(null);
      Alert.alert(
        'Success',
        'Database restored successfully. Please restart the app for changes to take effect.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('Error', 'Failed to restore backup');
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

        {/* Controls Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Backup Controls
            </Text>

            <List.Item
              title="Auto Backup"
              description="Automatically backup database every 2 hours"
              left={(props) => (
                <List.Icon {...props} icon="backup-restore" color={theme.colors.primary} />
              )}
              right={(props) => (
                <Switch
                  value={backupStatus.isEnabled}
                  onValueChange={handleToggleAutoBackup}
                  color={theme.colors.primary}
                />
              )}
            />

            <Divider style={styles.divider} />

            <Button
              mode="contained"
              onPress={handleCreateBackup}
              loading={creating}
              disabled={creating}
              style={styles.button}
              icon="content-save"
            >
              Create Manual Backup
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
              description={getDatabaseLocation()}
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
                    style={styles.restoreButton}
                    icon="restore"
                  >
                    Restore
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => showDeleteDialog(backup)}
                    style={styles.deleteButton}
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
          <Dialog.Title>Restore Database</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to restore the database from this backup?
              {'\n\n'}
              This will replace your current database with the backup data.
              A backup of your current database will be created before restoring.
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
            <Button onPress={() => setRestoreDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleRestoreBackup} textColor={theme.colors.primary}>
              Restore
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
  loadingText: {
    marginTop: spacing.md,
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
    gap: spacing.sm,
  },
  restoreButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    borderColor: '#ef4444',
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
