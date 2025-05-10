import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Contact, Task } from '../types';
import { getContacts, getTasks } from '../database';
import { LoadingIndicator, ContactCard, TaskCard } from '../components';
import { spacing, shadows } from '../constants/theme';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const contactsData = await getContacts();
        const tasksData = await getTasks();
        
        setContacts(contactsData.slice(0, 5)); // Show only 5 recent contacts
        setTasks(tasksData.filter(task => task.status !== 'completed').slice(0, 5)); // Show only 5 pending tasks
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, shadows.md, { backgroundColor: theme.colors.primary }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="account-group" size={32} color="#fff" />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {contacts.length}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Contacts
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={[styles.statCard, shadows.md, { backgroundColor: theme.colors.secondary }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="checkbox-marked-outline" size={32} color="#fff" />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {tasks.length}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Tasks
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Contacts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Contacts
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Contacts')}
              labelStyle={{ color: theme.colors.primary }}
            >
              View All
            </Button>
          </View>
          
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onPress={(contact) => navigation.navigate('ContactDetails', { contactId: contact.id! })}
              />
            ))
          ) : (
            <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  No contacts yet. Add your first contact to get started.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddContact')}
                  style={styles.emptyButton}
                >
                  Add Contact
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Pending Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Pending Tasks
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Tasks')}
              labelStyle={{ color: theme.colors.primary }}
            >
              View All
            </Button>
          </View>
          
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={(task) => navigation.navigate('TaskDetails', { taskId: task.id! })}
              />
            ))
          ) : (
            <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  No pending tasks. Add a task to get started.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddTask', {})}
                  style={styles.emptyButton}
                >
                  Add Task
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddContact')}
        color="#fff"
      />
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: spacing.xs,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
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
  emptyCard: {
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DashboardScreen;
