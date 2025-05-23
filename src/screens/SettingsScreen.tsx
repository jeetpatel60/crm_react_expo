import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  List,
  Switch,
  Divider,
  Button,
  Dialog,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { spacing } from '../constants/theme';
import { APP_NAME } from '../constants';
import { ThemeMode } from '../hooks/useThemeManager';
import { useThemeContext } from '../context';
import { ThemeIndicator } from '../components';
import { RootStackParamList, DrawerParamList } from '../types';
import {
  getBackupStatus,
  getDatabaseLocation,
  getBackupLocation,
  BackupStatus
} from '../utils/backupUtils';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;

const SettingsScreen = () => {
  const { themeMode, setThemeMode, isDarkMode } = useThemeContext();
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const [notifications, setNotifications] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isEnabled: false,
    lastBackup: null,
    nextBackup: null,
    backupCount: 0,
  });

  // Log theme changes
  useEffect(() => {
    console.log('SettingsScreen - Theme mode changed:', themeMode);
    console.log('SettingsScreen - Is dark mode:', isDarkMode);
  }, [themeMode, isDarkMode]);

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

  const toggleNotifications = () => setNotifications(!notifications);
  const toggleSync = () => setSyncEnabled(!syncEnabled);

  const handleResetData = () => {
    setResetDialogVisible(false);
    // Implement data reset logic here
    Alert.alert('Success', 'All data has been reset successfully.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ThemeIndicator />
      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Theme"
            description="Customize the app's appearance"
            left={(props) => (
              <List.Icon
                {...props}
                icon="theme-light-dark"
                color={theme.colors.primary}
              />
            )}
            onPress={() => {
              // The ThemeIndicator at the top of the screen already handles theme switching
              // This is just an informational item now
            }}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Notifications</List.Subheader>
          <List.Item
            title="Enable Notifications"
            description="Receive reminders for upcoming tasks"
            left={(props) => (
              <List.Icon {...props} icon="bell-outline" color={theme.colors.primary} />
            )}
            right={(props) => (
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                color={theme.colors.primary}
              />
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Data</List.Subheader>
          <List.Item
            title="Cloud Sync"
            description="Sync your data across devices"
            left={(props) => (
              <List.Icon {...props} icon="cloud-sync" color={theme.colors.primary} />
            )}
            right={(props) => (
              <Switch
                value={syncEnabled}
                onValueChange={toggleSync}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Export Data"
            description="Export your data as CSV"
            left={(props) => (
              <List.Icon {...props} icon="export" color={theme.colors.primary} />
            )}
            onPress={() => {
              // Implement export logic
              Alert.alert('Coming Soon', 'This feature will be available in a future update.');
            }}
          />
          <List.Item
            title="Import Data"
            description="Import data from CSV file"
            left={(props) => (
              <List.Icon {...props} icon="import" color={theme.colors.primary} />
            )}
            onPress={() => {
              // Implement import logic
              Alert.alert('Coming Soon', 'This feature will be available in a future update.');
            }}
          />
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
            title="Database Location"
            description="View database file location"
            left={(props) => (
              <List.Icon {...props} icon="folder-open" color={theme.colors.primary} />
            )}
            onPress={() => {
              Alert.alert(
                'Database Location',
                `Database file is located at:\n\n${getDatabaseLocation()}\n\nBackups are stored at:\n\n${getBackupLocation()}`,
                [{ text: 'OK' }]
              );
            }}
          />
          <List.Item
            title="Database Migrations"
            description="Run database migrations manually"
            left={(props) => (
              <List.Icon {...props} icon="database" color={theme.colors.primary} />
            )}
            onPress={() => navigation.navigate('DatabaseMigration')}
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
