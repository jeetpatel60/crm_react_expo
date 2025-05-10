import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, FAB, useTheme, Divider, IconButton } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Contact, Task } from '../types';
import { getContactById, deleteContact, getTasksByContactId } from '../database';
import { LoadingIndicator, TaskCard } from '../components';
import { spacing, shadows } from '../constants/theme';

type ContactDetailsRouteProp = RouteProp<RootStackParamList, 'ContactDetails'>;
type ContactDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const ContactDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<ContactDetailsRouteProp>();
  const navigation = useNavigation<ContactDetailsNavigationProp>();
  const { contactId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<Contact | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const contactData = await getContactById(contactId);
        setContact(contactData);
        
        const tasksData = await getTasksByContactId(contactId);
        setTasks(tasksData);
      } catch (error) {
        console.error('Error loading contact details:', error);
        Alert.alert('Error', 'Failed to load contact details. Please try again.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contactId]);

  const handleDeleteContact = async () => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (contact?.id) {
                await deleteContact(contact.id);
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading || !contact) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.contactCard, shadows.md, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.contactHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text variant="headlineSmall" style={styles.name}>
                  {contact.name}
                </Text>
                {contact.company && (
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    {contact.company}
                  </Text>
                )}
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.contactDetails}>
              {contact.email && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">{contact.email}</Text>
                </View>
              )}
              
              {contact.phone && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">{contact.phone}</Text>
                </View>
              )}
              
              {contact.notes && (
                <View style={styles.notesContainer}>
                  <Text variant="titleMedium" style={styles.notesTitle}>
                    Notes
                  </Text>
                  <Text variant="bodyMedium" style={styles.notes}>
                    {contact.notes}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => navigation.navigate('EditContact', { contact })}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDeleteContact}
                style={styles.actionButton}
                textColor={theme.colors.error}
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Tasks
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('AddTask', { contactId })}
              labelStyle={{ color: theme.colors.primary }}
            >
              Add Task
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
                  No tasks associated with this contact.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddTask', { contactId })}
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
        onPress={() => navigation.navigate('AddTask', { contactId })}
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
  contactCard: {
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  contactInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.md,
  },
  contactDetails: {
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailIcon: {
    marginRight: spacing.md,
  },
  notesContainer: {
    marginTop: spacing.md,
  },
  notesTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  notes: {
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  tasksSection: {
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

export default ContactDetailsScreen;
