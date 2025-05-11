import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Searchbar, FAB, useTheme, SegmentedButtons } from 'react-native-paper';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList, DrawerParamList } from '../types';
import { Project, ProjectStatus } from '../database/projectsDb';
import { getProjects, deleteProject } from '../database';
import { db } from '../database/database';
import { ProjectCard, LoadingIndicator, EmptyState } from '../components';
import { spacing, shadows, animations } from '../constants/theme';
import { PROJECT_STATUS_OPTIONS } from '../constants';

type ProjectsScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'Projects'>,
  StackNavigationProp<RootStackParamList>
>;

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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    setRefreshing(true);

    // Refresh data without showing loading indicator
    const refreshData = async () => {
      try {
        console.log('Refreshing projects on pull-to-refresh');

        const projectsData = await getProjects();
        console.log(`Pull-to-refresh completed: ${projectsData.length} projects`);

        setProjects(projectsData);

        // Apply filters
        let filtered = projectsData;
        if (searchQuery) {
          filtered = filtered.filter(project =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (statusFilter !== 'all') {
          filtered = filtered.filter(project => project.status === statusFilter);
        }

        setFilteredProjects(filtered);
      } catch (error) {
        console.error('Error refreshing projects on pull:', error);
        Alert.alert('Error', 'Failed to refresh projects');
      } finally {
        setRefreshing(false);
      }
    };

    refreshData();
  }, [searchQuery, statusFilter]);

  // Initial load - runs only once when component mounts
  useEffect(() => {
    console.log('Initial load of projects');
    const initialLoad = async () => {
      try {
        console.log('Starting initial load...');
        setLoading(true);

        const projectsData = await getProjects();
        console.log(`Initial load completed: ${projectsData.length} projects`);

        setProjects(projectsData);
        setFilteredProjects(projectsData);

      } catch (error) {
        console.error('Error in initial load:', error);
        Alert.alert('Error', 'Failed to load projects');
      } finally {
        console.log('Initial load complete, setting loading to false');
        setLoading(false);
      }
    };

    initialLoad();
  }, []);  // Empty dependency array means this runs once on mount

  // Refresh when screen comes into focus (but not on initial load)
  useFocusEffect(
    useCallback(() => {
      console.log('Projects screen focused - FORCE refreshing data with DIRECT SQL');

      // Force refresh data without showing loading indicator
      const forceRefreshData = async () => {
        try {
          console.log('FORCE refreshing projects on screen focus');

          // Clear existing projects first to force a complete refresh
          setProjects([]);
          setFilteredProjects([]);

          // Small delay to ensure state updates before fetching new data
          setTimeout(async () => {
            // Use direct SQL query to get fresh data
            const projectsData = await db.getAllAsync(
              `SELECT * FROM projects ORDER BY name ASC;`
            );
            console.log(`Focus FORCE refresh completed with DIRECT SQL: ${projectsData.length} projects`);

            // Log all projects' progress for debugging
            projectsData.forEach(project => {
              console.log(`Refreshed Project: ${project.name}, Progress: ${project.progress}%, Updated: ${new Date(project.updated_at || 0).toISOString()}`);
            });

            setProjects(projectsData);

            // Apply filters
            let filtered = projectsData;
            if (searchQuery) {
              filtered = filtered.filter(project =>
                project.name.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            if (statusFilter !== 'all') {
              filtered = filtered.filter(project => project.status === statusFilter);
            }

            setFilteredProjects(filtered);
          }, 100);
        } catch (error) {
          console.error('Error force refreshing projects on focus:', error);
        }
      };

      forceRefreshData();

      return () => {
        console.log('Projects screen focus cleanup');
      };
    }, [searchQuery, statusFilter]) // Only depend on filter values, not on loadProjects
  );

  // Log when projects data changes
  useEffect(() => {
    console.log('Projects data changed, projects count:', projects.length);
    if (projects.length > 0) {
      console.log('First project progress:', projects[0].progress);
    }
  }, [projects]);

  // Apply filters when projects, searchQuery, or statusFilter changes
  useEffect(() => {
    console.log('Applying filters to projects...');
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

    console.log(`After filtering: ${filtered.length} projects`);
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
              console.log(`Deleting project with ID: ${projectId}`);
              await deleteProject(projectId);
              console.log('Project deleted successfully, refreshing list');

              // Reload projects after deletion
              setLoading(true);
              const projectsData = await getProjects();
              setProjects(projectsData);

              // Apply filters
              let filtered = projectsData;
              if (searchQuery) {
                filtered = filtered.filter(project =>
                  project.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
              }
              if (statusFilter !== 'all') {
                filtered = filtered.filter(project => project.status === statusFilter);
              }

              setFilteredProjects(filtered);
              setLoading(false);
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
          // Use project ID, progress, and updated_at to create a unique key
          keyExtractor={(item) => `${item.id}-${item.progress}-${item.updated_at || Date.now()}`}
          extraData={filteredProjects} // Make sure FlatList re-renders when data changes
          renderItem={({ item, index }) => {
            console.log(`Rendering project card: ${item.name}, Progress: ${item.progress}%`);
            return (
              <ProjectCard
                project={item}
                onPress={(project) => navigation.navigate('ProjectDetails', { projectId: project.id! })}
                onEdit={(project) => navigation.navigate('EditProject', { project })}
                onDelete={(projectId) => handleDeleteProject(projectId)}
                index={index}
                key={`project-${item.id}-${item.progress}-${item.updated_at || Date.now()}`} // Add key with progress and timestamp to force re-render
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
