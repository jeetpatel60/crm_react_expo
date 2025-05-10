import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, FAB, useTheme, Chip, SegmentedButtons } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Task, TaskStatus } from '../database/tasksDb';
import { getTasks, deleteTask, updateTask } from '../database';
import { TaskCard, LoadingIndicator, EmptyState } from '../components';
import { spacing } from '../constants/theme';
import { TASK_STATUS_OPTIONS } from '../constants';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const TasksScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<TasksScreenNavigationProp>();
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      filterTasks(data, searchQuery, statusFilter);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const filterTasks = (taskList: Task[], query: string, status: string) => {
    let filtered = taskList;
    
    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter((task) => task.status === status);
    }
    
    // Filter by search query
    if (query.trim() !== '') {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    setFilteredTasks(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterTasks(tasks, query, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterTasks(tasks, searchQuery, status);
  };

  const handleDeleteTask = (taskId: number) => {
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
              await deleteTask(taskId);
              loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTask({ ...task, status: newStatus });
      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search tasks..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.onSurface }}
      />

      <SegmentedButtons
        value={statusFilter}
        onValueChange={handleStatusFilter}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
        ]}
        style={styles.segmentedButtons}
      />

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="No Tasks Found"
          message={
            searchQuery || statusFilter !== 'all'
              ? "We couldn't find any tasks matching your filters."
              : "You don't have any tasks yet. Add your first task to get started."
          }
          buttonText={searchQuery || statusFilter !== 'all' ? undefined : "Add Task"}
          onButtonPress={searchQuery || statusFilter !== 'all' ? undefined : () => navigation.navigate('AddTask', {})}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={(task) => navigation.navigate('TaskDetails', { taskId: task.id! })}
              onEdit={(task) => navigation.navigate('EditTask', { task })}
              onDelete={(taskId) => handleDeleteTask(taskId)}
              onStatusChange={handleStatusChange}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddTask', {})}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: spacing.md,
    elevation: 2,
    borderRadius: 8,
  },
  segmentedButtons: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default TasksScreen;
