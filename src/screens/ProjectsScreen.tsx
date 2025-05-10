import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, FAB, useTheme, SegmentedButtons } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList } from '../types';
import { Project, ProjectStatus } from '../database/projectsDb';
import { getProjects, deleteProject } from '../database';
import { ProjectCard, LoadingIndicator, EmptyState } from '../components';
import { spacing, shadows, animations } from '../constants/theme';
import { PROJECT_STATUS_OPTIONS } from '../constants';

type ProjectsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ALL_PROJECT_STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  ...PROJECT_STATUS_OPTIONS,
];

const ProjectsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ProjectsScreenNavigationProp>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const projectsData = await getProjects();
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  useEffect(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [searchQuery, statusFilter, projects]);

  const handleDeleteProject = (projectId: number) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId);
              loadProjects();
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const onChangeSearch = (query: string) => setSearchQuery(query);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.searchContainer, shadows.sm]}
      >
        <Searchbar
          placeholder="Search projects..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          clearButtonMode="while-editing"
        />
      </Animated.View>

      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={ALL_PROJECT_STATUS_OPTIONS.map(option => ({
          value: option.value,
          label: option.label,
        }))}
        style={styles.segmentedButtons}
      />

      {loading ? (
        <LoadingIndicator />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon="office-building"
          title="No Projects"
          message={searchQuery || statusFilter !== 'all' ? "No projects match your search" : "You haven't added any projects yet"}
          buttonText={searchQuery || statusFilter !== 'all' ? undefined : "Add Project"}
          onButtonPress={searchQuery || statusFilter !== 'all' ? undefined : () => navigation.navigate('AddProject')}
        />
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item, index }) => (
            <ProjectCard
              project={item}
              onPress={(project) => navigation.navigate('ProjectDetails', { projectId: project.id! })}
              onEdit={(project) => navigation.navigate('EditProject', { project })}
              onDelete={(projectId) => handleDeleteProject(projectId)}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('AddProject')}
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
  segmentedButtons: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ProjectsScreen;
