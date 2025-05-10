import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../types';
import { shadows, spacing } from '../constants/theme';
import { TASK_STATUS_COLORS } from '../constants';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onStatusChange?: (task: Task, newStatus: Task['status']) => void;
}

const TaskCard = ({ task, onPress, onEdit, onDelete, onStatusChange }: TaskCardProps) => {
  const theme = useTheme();
  
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'No due date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <Card
      style={[
        styles.card,
        shadows.md,
        { backgroundColor: theme.colors.surface }
      ]}
      onPress={() => onPress(task)}
    >
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
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
        
        {task.description && (
          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons
              name="calendar"
              size={16}
              color={theme.colors.onSurfaceVariant}
              style={styles.dateIcon}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatDate(task.due_date)}
            </Text>
          </View>
          
          <View style={styles.actions}>
            {onStatusChange && task.status !== 'completed' && (
              <IconButton
                icon="check"
                size={20}
                iconColor={theme.colors.success}
                onPress={() => onStatusChange(task, 'completed')}
              />
            )}
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.secondary}
                onPress={() => onEdit(task)}
              />
            )}
            {onDelete && task.id && (
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => onDelete(task.id!)}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  content: {
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 28,
  },
  description: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TaskCard;
