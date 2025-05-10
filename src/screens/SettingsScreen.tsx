import React, { useState } from 'react';
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
import { spacing } from '../constants/theme';
import { APP_NAME } from '../constants';

const SettingsScreen = () => {
  const theme = useTheme();
  
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleNotifications = () => setNotifications(!notifications);
  const toggleSync = () => setSyncEnabled(!syncEnabled);

  const handleResetData = () => {
    setResetDialogVisible(false);
    // Implement data reset logic here
    Alert.alert('Success', 'All data has been reset successfully.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            description="Enable dark theme throughout the app"
            left={(props) => (
              <List.Icon {...props} icon="theme-light-dark" color={theme.colors.primary} />
            )}
            right={(props) => (
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                color={theme.colors.primary}
              />
            )}
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
            description="Delete all contacts and tasks"
            left={(props) => (
              <List.Icon {...props} icon="delete" color={theme.colors.error} />
            )}
            onPress={() => setResetDialogVisible(true)}
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
              Are you sure you want to reset all data? This action cannot be undone and will delete all your contacts and tasks.
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
