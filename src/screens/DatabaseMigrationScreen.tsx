import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { runClientIdMigration } from '../utils/migrationUtils';
import { spacing, shadows } from '../constants/theme';

type DatabaseMigrationScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const DatabaseMigrationScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<DatabaseMigrationScreenNavigationProp>();
  const [loading, setLoading] = useState(false);

  const handleRunMigration = async () => {
    setLoading(true);
    try {
      await runClientIdMigration();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              Database Migration
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              This screen allows you to run database migrations manually if they failed to run automatically.
            </Text>

            <View style={styles.migrationSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Client ID Migration
              </Text>
              <Text variant="bodyMedium" style={styles.migrationDescription}>
                This migration adds a client_id column to the units_flats table, which is required for the client selection feature.
              </Text>
              <Button
                mode="contained"
                onPress={handleRunMigration}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                Run Client ID Migration
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={[styles.button, styles.backButton]}
        >
          Back
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: spacing.lg,
  },
  migrationSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  migrationDescription: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  backButton: {
    marginTop: spacing.md,
  },
});

export default DatabaseMigrationScreen;
