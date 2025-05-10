import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, useTheme, Divider, IconButton, Chip, DataTable, Menu, FAB } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList } from '../types';
import { ProjectSchedule, Milestone, Project } from '../types';
import { getProjectScheduleById, getProjectById, getMilestonesByScheduleId, deleteMilestone } from '../database';
import { LoadingIndicator } from '../components';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { MILESTONE_STATUS_COLORS } from '../constants';

type ProjectScheduleDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ProjectScheduleDetails'>;
type ProjectScheduleDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProjectScheduleDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<ProjectScheduleDetailsScreenRouteProp>();
  const navigation = useNavigation<ProjectScheduleDetailsScreenNavigationProp>();
  const { scheduleId } = route.params;

  const [schedule, setSchedule] = useState<ProjectSchedule | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const scheduleData = await getProjectScheduleById(scheduleId);
        
        if (scheduleData) {
          setSchedule(scheduleData);
          
          // Load project data
          const projectData = await getProjectById(scheduleData.project_id);
          setProject(projectData);
          
          // Load milestones
          const milestonesData = await getMilestonesByScheduleId(scheduleId);
          setMilestones(milestonesData);
        }
      } catch (error) {
        console.error('Error loading schedule details:', error);
        Alert.alert('Error', 'Failed to load schedule details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [scheduleId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteMilestone = (milestoneId: number) => {
    Alert.alert(
      'Delete Milestone',
      'Are you sure you want to delete this milestone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilestone(milestoneId);
              // Refresh milestones
              const milestonesData = await getMilestonesByScheduleId(scheduleId);
              setMilestones(milestonesData);
            } catch (error) {
              console.error('Error deleting milestone:', error);
              Alert.alert('Error', 'Failed to delete milestone');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!schedule || !project) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Schedule not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={[styles.card, shadows.md, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.headerRow}>
                <Text variant="titleLarge" style={styles.title}>
                  {project.name}
                </Text>
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                  style={styles.menuButton}
                />
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={{ x: 0, y: 0 }}
                  style={styles.menu}
                >
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate('EditProjectSchedule', { schedule });
                    }}
                    title="Edit Schedule"
                    leadingIcon="pencil"
                  />
                </Menu>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.icon}
                />
                <Text variant="bodyLarge">
                  Date: {formatDate(schedule.date)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Card style={[styles.card, shadows.md, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.milestonesHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Milestones
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddMilestone', { scheduleId })}
                  style={styles.addButton}
                  labelStyle={styles.addButtonLabel}
                  icon="plus"
                >
                  Add Milestone
                </Button>
              </View>

              {milestones.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  No milestones added yet. Add a milestone to get started.
                </Text>
              ) : (
                <ScrollView horizontal style={styles.tableContainer}>
                  <DataTable style={styles.table}>
                    <DataTable.Header style={styles.tableHeader}>
                      <DataTable.Title style={styles.srNoColumn}>Sr No</DataTable.Title>
                      <DataTable.Title style={styles.milestoneColumn}>Milestone</DataTable.Title>
                      <DataTable.Title style={styles.completionColumn}>% Completion</DataTable.Title>
                      <DataTable.Title style={styles.statusColumn}>Status</DataTable.Title>
                      <DataTable.Title style={styles.actionsColumn}>Actions</DataTable.Title>
                    </DataTable.Header>

                    {milestones.map((milestone) => (
                      <DataTable.Row key={milestone.id} style={styles.tableRow}>
                        <DataTable.Cell style={styles.srNoColumn}>{milestone.sr_no}</DataTable.Cell>
                        <DataTable.Cell style={styles.milestoneColumn}>{milestone.milestone_name}</DataTable.Cell>
                        <DataTable.Cell style={styles.completionColumn}>{milestone.completion_percentage}%</DataTable.Cell>
                        <DataTable.Cell style={styles.statusColumn}>
                          <Chip
                            style={[
                              styles.statusChip,
                              { backgroundColor: MILESTONE_STATUS_COLORS[milestone.status] + '20' }
                            ]}
                            textStyle={{ color: MILESTONE_STATUS_COLORS[milestone.status], textAlign: 'center' }}
                          >
                            {milestone.status}
                          </Chip>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.actionsColumn}>
                          <View style={styles.actionButtons}>
                            <IconButton
                              icon="pencil"
                              size={18}
                              onPress={() => navigation.navigate('EditMilestone', { milestone })}
                              iconColor={theme.colors.primary}
                              style={styles.actionButton}
                            />
                            <IconButton
                              icon="delete"
                              size={18}
                              onPress={() => milestone.id && handleDeleteMilestone(milestone.id)}
                              iconColor={theme.colors.error}
                              style={styles.actionButton}
                            />
                          </View>
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('AddMilestone', { scheduleId })}
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
    paddingBottom: 80, // Space for FAB
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  menuButton: {
    marginRight: -8,
  },
  menu: {
    marginTop: 40,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  icon: {
    marginRight: spacing.sm,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  addButton: {
    borderRadius: borderRadius.md,
  },
  addButtonLabel: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: spacing.lg,
    fontStyle: 'italic',
  },
  tableContainer: {
    marginBottom: spacing.md,
  },
  table: {
    minWidth: '100%',
  },
  tableHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  srNoColumn: {
    flex: 0.5,
  },
  milestoneColumn: {
    flex: 2,
  },
  completionColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  statusColumn: {
    flex: 1.5,
    justifyContent: 'center',
  },
  actionsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  statusChip: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    margin: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ProjectScheduleDetailsScreen;
