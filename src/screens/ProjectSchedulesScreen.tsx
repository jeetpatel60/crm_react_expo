import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Searchbar, FAB, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList, DrawerParamList } from '../types';
import { ProjectSchedule, Project } from '../types';
import { getProjectSchedules, deleteProjectSchedule, getProjectById } from '../database';
import { ProjectScheduleCard, LoadingIndicator, EmptyState } from '../components';
import { spacing, shadows, animations } from '../constants/theme';

type ProjectSchedulesScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'ProjectSchedules'>,
  StackNavigationProp<RootStackParamList>
>;

const ProjectSchedulesScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ProjectSchedulesScreenNavigationProp>();

  const [schedules, setSchedules] = useState<ProjectSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ProjectSchedule[]>([]);
  const [projects, setProjects] = useState<Map<number, Project>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const schedulesData = await getProjectSchedules();
      setSchedules(schedulesData);

      // Apply search filter if needed
      if (searchQuery.trim() === '') {
        setFilteredSchedules(schedulesData);
      } else {
        // We'll filter after loading projects
      }

      // Load project data for each schedule
      const projectsMap = new Map<number, Project>();
      for (const schedule of schedulesData) {
        if (!projectsMap.has(schedule.project_id)) {
          const project = await getProjectById(schedule.project_id);
          if (project) {
            projectsMap.set(schedule.project_id, project);
          }
        }
      }
      setProjects(projectsMap);

      // Apply search filter if needed
      if (searchQuery.trim() !== '') {
        const filtered = schedulesData.filter((schedule) => {
          const project = projectsMap.get(schedule.project_id);
          if (!project) return false;

          const projectNameMatch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
          const dateMatch = new Date(schedule.date)
            .toLocaleDateString('en-IN')
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

          return projectNameMatch || dateMatch;
        });
        setFilteredSchedules(filtered);
      }
    } catch (error) {
      console.error('Error loading project schedules:', error);
      Alert.alert('Error', 'Failed to load project schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedules();
  }, [loadSchedules]);

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredSchedules(schedules);
      return;
    }

    const filtered = schedules.filter((schedule) => {
      const project = projects.get(schedule.project_id);
      if (!project) return false;

      const projectNameMatch = project.name.toLowerCase().includes(query.toLowerCase());
      const dateMatch = new Date(schedule.date)
        .toLocaleDateString('en-IN')
        .toLowerCase()
        .includes(query.toLowerCase());

      return projectNameMatch || dateMatch;
    });

    setFilteredSchedules(filtered);
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule? This will also delete all milestones associated with this schedule.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProjectSchedule(scheduleId);
              loadSchedules();
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(animations.duration.standard)}
        style={[styles.searchContainer, shadows.sm]}
      >
        <Searchbar
          placeholder="Search schedules..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          clearButtonMode="while-editing"
        />
      </Animated.View>

      {loading ? (
        <LoadingIndicator />
      ) : filteredSchedules.length === 0 ? (
        <EmptyState
          icon="calendar-clock"
          title="No Schedules"
          message={searchQuery ? "No schedules match your search" : "You haven't added any project schedules yet"}
          buttonText={searchQuery ? undefined : "Add Schedule"}
          onButtonPress={searchQuery ? undefined : () => navigation.navigate('AddProjectSchedule')}
        />
      ) : (
        <FlatList
          data={filteredSchedules}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item, index }) => {
            const project = projects.get(item.project_id);
            if (!project) return null;

            return (
              <ProjectScheduleCard
                schedule={item}
                project={project}
                onPress={(schedule) => navigation.navigate('ProjectScheduleDetails', { scheduleId: schedule.id! })}
                onEdit={(schedule) => navigation.navigate('EditProjectSchedule', { schedule })}
                onDelete={(scheduleId) => handleDeleteSchedule(scheduleId)}
                index={index}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              progressBackgroundColor={theme.colors.surface}
            />
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('AddProjectSchedule')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchbar: {
    borderRadius: 8,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ProjectSchedulesScreen;
