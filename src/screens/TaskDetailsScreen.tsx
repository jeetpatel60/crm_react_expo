import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Divider } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Task } from '../types';
import { getTaskById, deleteTask, getContactById } from '../database';
import { LoadingIndicator } from '../components';
import { spacing, shadows } from '../constants/theme';
import { TASK_STATUS_COLORS } from '../constants';

type TaskDetailsRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;
type TaskDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const TaskDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<TaskDetailsRouteProp>();
  const navigation = useNavigation<TaskDetailsNavigationProp>();
  const { taskId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [contactName, setContactName] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const taskData = await getTaskById(taskId);
        setTask(taskData);
        
        if (taskData.contact_id) {
          try {
            const contactData = await getContactById(taskData.contact_id);
            setContactName(contactData.name);
          } catch (error) {
            console.error('Error loading contact for task:', error);
            setContactName(null);
          }
        }
      } catch (error) {
        console.error('Error loading task details:', error);
        Alert.alert('Error', 'Failed to load task details. Please try again.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId]);

  const handleDeleteTask = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (task?.id) {
                await deleteTask(task.id);
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'No due date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Task['status']) => {
    return TASK_STATUS_COLORS[status] || theme.colors.primary;
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'clock-outline';
      case 'in_progress':
        return 'progress-clock';
      case 'completed':
        return 'check-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  if (loading || !task) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.taskCard, shadows.md, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {task.title}
              </Text>
              <Chip
                icon={() => (
                  <MaterialCommunityIcons
                    name={getStatusIcon(task.status)}
                    size={16}
                    color="#fff"
                  />
                )}
                style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}
                textStyle={{ color: '#fff' }}
              >
                {task.status.replace('_', ' ')}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.taskDetails}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <View>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Due Date
                  </Text>
                  <Text variant="bodyLarge">
                    {formatDate(task.due_date)}
                  </Text>
                </View>
              </View>
              
              {contactName && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="account"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <View>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      Contact
                    </Text>
                    <Text
                      variant="bodyLarge"
                      onPress={() => {
                        if (task.contact_id) {
                          navigation.navigate('ContactDetails', { contactId: task.contact_id });
                        }
                      }}
                      style={{ color: theme.colors.primary }}
                    >
                      {contactName}
                    </Text>
                  </View>
                </View>
              )}
              
              {task.description && (
                <View style={styles.descriptionContainer}>
                  <Text variant="titleMedium" style={styles.descriptionTitle}>
                    Description
                  </Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {task.description}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => navigation.navigate('EditTask', { task })}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDeleteTask}
                style={styles.actionButton}
                textColor={theme.colors.error}
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>
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
  taskCard: {
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: spacing.md,
  },
  taskDetails: {
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
  descriptionContainer: {
    marginTop: spacing.md,
  },
  descriptionTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  description: {
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
});

export default TaskDetailsScreen;
