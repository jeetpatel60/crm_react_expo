import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { LoadingIndicator } from '../components';
import { spacing, shadows } from '../constants/theme';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load dashboard data here
      // This will be updated to load data from other features
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.surface}
          />
        }>
        {/* Welcome Section */}
        <View style={styles.section}>
          <Card style={[styles.welcomeCard, shadows.md, { backgroundColor: theme.colors.primary }]}>
            <Card.Content style={styles.welcomeContent}>
              <Text variant="headlineMedium" style={styles.welcomeTitle}>
                Welcome to CRM App
              </Text>
              <Text variant="bodyMedium" style={styles.welcomeText}>
                Manage your business efficiently with our CRM tools.
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Links Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Links
            </Text>
          </View>

          <View style={styles.quickLinksContainer}>
            <Card
              style={[styles.quickLinkCard, shadows.sm, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => navigation.navigate('Clients')}
            >
              <Card.Content style={styles.quickLinkContent}>
                <MaterialCommunityIcons name="account-tie" size={32} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.quickLinkText}>Clients</Text>
              </Card.Content>
            </Card>

            <Card
              style={[styles.quickLinkCard, shadows.sm, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => navigation.navigate('Projects')}
            >
              <Card.Content style={styles.quickLinkContent}>
                <MaterialCommunityIcons name="briefcase" size={32} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.quickLinkText}>Projects</Text>
              </Card.Content>
            </Card>

            <Card
              style={[styles.quickLinkCard, shadows.sm, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => navigation.navigate('Leads')}
            >
              <Card.Content style={styles.quickLinkContent}>
                <MaterialCommunityIcons name="account-convert" size={32} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.quickLinkText}>Leads</Text>
              </Card.Content>
            </Card>

            <Card
              style={[styles.quickLinkCard, shadows.sm, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Card.Content style={styles.quickLinkContent}>
                <MaterialCommunityIcons name="cog" size={32} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.quickLinkText}>Settings</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
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
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  welcomeCard: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  welcomeContent: {
    padding: spacing.md,
  },
  welcomeTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLinkCard: {
    width: '48%',
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  quickLinkContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  quickLinkText: {
    marginTop: spacing.sm,
    fontWeight: '500',
  },
});

export default DashboardScreen;
