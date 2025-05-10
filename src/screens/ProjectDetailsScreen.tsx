import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, useTheme, Divider, IconButton, ProgressBar, Chip } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Project } from '../types';
import { getProjectById, deleteProject } from '../database';
import { LoadingIndicator } from '../components';
import { spacing, shadows } from '../constants/theme';

type ProjectDetailsRouteProp = RouteProp<RootStackParamList, 'ProjectDetails'>;
type ProjectDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const ProjectDetailsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ProjectDetailsNavigationProp>();
  const route = useRoute<ProjectDetailsRouteProp>();
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await getProjectById(projectId);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading project:', error);
        Alert.alert('Error', 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleDelete = () => {
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
              if (project?.id) {
                await deleteProject(project.id);
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (project) {
      navigation.navigate('EditProject', { project });
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Not set';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'Not specified';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Not Started':
        return theme.colors.error;
      case 'In Progress':
        return theme.colors.primary;
      case 'Completed':
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!project) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Project not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="headlineMedium" style={styles.title}>
                {project.name}
              </Text>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(project.status) },
                ]}
                textStyle={{ color: '#fff' }}
              >
                {project.status}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Project Details
              </Text>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.icon}
                />
                <View style={styles.detailContent}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>
                    Address
                  </Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {project.address || 'Not specified'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.icon}
                />
                <View style={styles.detailContent}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>
                    Timeline
                  </Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="currency-inr"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.icon}
                />
                <View style={styles.detailContent}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>
                    Total Budget
                  </Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {formatCurrency(project.total_budget)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.icon}
                />
                <View style={styles.detailContent}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>
                    Progress
                  </Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>
                    {project.progress || 0}%
                  </Text>
                  <ProgressBar
                    progress={(project.progress || 0) / 100}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleEdit}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            icon="pencil"
          >
            Edit Project
          </Button>
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.button}
            textColor={theme.colors.error}
            icon="delete"
          >
            Delete Project
          </Button>
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
  },
  card: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  icon: {
    marginTop: 2,
    marginRight: spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: 'gray',
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.md,
  },
});

export default ProjectDetailsScreen;
