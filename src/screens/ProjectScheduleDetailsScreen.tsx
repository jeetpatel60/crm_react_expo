import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Card, Button, useTheme, Divider, IconButton, DataTable, Menu, FAB, Modal, Portal, TextInput, SegmentedButtons } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList } from '../types';
import { ProjectSchedule, Milestone, Project } from '../types';
import { getProjectById } from '../database';
import { getProjectScheduleById, getMilestonesByScheduleId, deleteMilestone, updateMilestone, MilestoneStatus } from '../database/projectSchedulesDb';
import { db } from '../database/database';
import { LoadingIndicator, StatusChip } from '../components';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { MILESTONE_STATUS_OPTIONS } from '../constants';

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

  // Edit milestone modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editMilestoneName, setEditMilestoneName] = useState('');
  const [editCompletionPercentage, setEditCompletionPercentage] = useState(0);
  const [editStatus, setEditStatus] = useState<MilestoneStatus>('Not Started');
  const [editSrNo, setEditSrNo] = useState(1);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});

  // Function to load all data
  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

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
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [scheduleId]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus (like when returning from edit screen)
  useFocusEffect(
    useCallback(() => {
      // Only reload data when returning to the screen, not on initial load
      const reloadData = async () => {
        try {
          console.log('Screen focused - reloading data for schedule ID:', scheduleId);

          // First, reload the project data to get the updated progress
          if (schedule) {
            console.log('Reloading project data to get updated progress');
            const projectData = await getProjectById(schedule.project_id);
            if (projectData) {
              console.log(`Refreshed project data: ${projectData.name}, Progress: ${projectData.progress}%`);
              setProject(projectData);
            }
          }

          // Then reload milestones
          console.log('Reloading milestones');
          const milestonesData = await getMilestonesByScheduleId(scheduleId);
          console.log('Fetched milestones:', milestonesData.length, 'milestones');
          setMilestones(milestonesData);

          console.log('Data refresh complete');
        } catch (error) {
          console.error('Error reloading data:', error);
        }
      };

      reloadData();

      // Return cleanup function
      return () => {
        console.log('Screen focus effect cleanup');
      };
    }, [scheduleId, schedule])
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to open the edit modal with a milestone
  const handleOpenEditModal = (milestone: Milestone) => {
    console.log('Opening edit modal for milestone:', milestone);
    setEditingMilestone(milestone);
    setEditMilestoneName(milestone.milestone_name);
    setEditCompletionPercentage(milestone.completion_percentage);
    setEditStatus(milestone.status);
    setEditSrNo(milestone.sr_no);
    setEditErrors({});
    setEditModalVisible(true);
  };

  // Function to close the edit modal
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingMilestone(null);
  };

  // Function to validate the edit form
  const validateEditForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!editMilestoneName.trim()) {
      newErrors.milestoneName = 'Milestone name is required';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to save the edited milestone
  const handleSaveEditedMilestone = async () => {
    if (!validateEditForm() || !editingMilestone) {
      return;
    }

    // Create the updated milestone object
    const updatedMilestone: Milestone = {
      ...editingMilestone,
      sr_no: editSrNo,
      milestone_name: editMilestoneName.trim(),
      completion_percentage: editCompletionPercentage,
      status: editStatus,
    };

    // Check if status is changing to "Completed"
    const statusChangingToCompleted = editingMilestone.status !== 'Completed' && editStatus === 'Completed';

    if (statusChangingToCompleted) {
      // Show confirmation dialog
      Alert.alert(
        'Update Project Progress',
        'Marking this milestone as completed will update the overall project progress. Continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('Milestone status update cancelled');
            }
          },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                setEditLoading(true);
                console.log('Status is changing to Completed - updating project progress');

                console.log('Updating milestone:', updatedMilestone);
                await updateMilestone(updatedMilestone);
                console.log('Milestone updated successfully');

                // Add a small delay to ensure the database update completes, especially for progress calculation
                setTimeout(async () => {
                  console.log('Refreshing milestones after update');
                  // Refresh the milestones list
                  const milestonesData = await getMilestonesByScheduleId(scheduleId);
                  setMilestones(milestonesData);

                  // Refresh project data to get updated progress using direct SQL query
                  if (schedule) {
                    // First try with direct SQL query to avoid any caching issues
                    try {
                      const freshProjectData = await db.getFirstAsync<Project>(
                        `SELECT * FROM projects WHERE id = ? LIMIT 1;`,
                        [schedule.project_id]
                      );

                      if (freshProjectData) {
                        console.log(`Updated project progress via direct SQL: ${freshProjectData.progress}%`);
                        setProject(freshProjectData);
                      } else {
                        // Fallback to regular function
                        const projectData = await getProjectById(schedule.project_id);
                        if (projectData) {
                          console.log(`Updated project progress via getProjectById: ${projectData.progress}%`);
                          setProject(projectData);
                        }
                      }
                    } catch (sqlError) {
                      console.error('Error getting project with direct SQL:', sqlError);
                      // Fallback to regular function
                      const projectData = await getProjectById(schedule.project_id);
                      if (projectData) {
                        console.log(`Updated project progress via getProjectById: ${projectData.progress}%`);
                        setProject(projectData);
                      }
                    }
                  }

                  // Close the modal
                  handleCloseEditModal();
                }, 300);
              } catch (error) {
                console.error('Error updating milestone:', error);
                Alert.alert('Error', 'Failed to update milestone');
                setEditLoading(false);
              }
            }
          }
        ]
      );
    } else {
      // For non-completion status changes, proceed without confirmation
      try {
        setEditLoading(true);

        console.log('Updating milestone:', updatedMilestone);
        await updateMilestone(updatedMilestone);
        console.log('Milestone updated successfully');

        // Add a small delay to ensure the database update completes
        setTimeout(async () => {
          console.log('Refreshing milestones after update');
          // Refresh the milestones list
          const milestonesData = await getMilestonesByScheduleId(scheduleId);
          setMilestones(milestonesData);

          // Refresh project data to get updated progress
          if (schedule) {
            try {
              const projectData = await getProjectById(schedule.project_id);
              if (projectData) {
                console.log(`Updated project data after non-completion status change: ${projectData.progress}%`);
                setProject(projectData);
              }
            } catch (error) {
              console.error('Error refreshing project data:', error);
            }
          }

          // Close the modal
          handleCloseEditModal();
        }, 300);
      } catch (error) {
        console.error('Error updating milestone:', error);
        Alert.alert('Error', 'Failed to update milestone');
        setEditLoading(false);
      }
    }
  };

  const handleDeleteMilestone = (milestoneId: number) => {
    console.log('Delete milestone requested for ID:', milestoneId);

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
              console.log('Deleting milestone with ID:', milestoneId);
              await deleteMilestone(milestoneId);
              console.log('Milestone deleted successfully');

              // Refresh milestones
              console.log('Refreshing milestones after delete');
              const milestonesData = await getMilestonesByScheduleId(scheduleId);
              console.log('Fetched', milestonesData.length, 'milestones after delete');
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
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={handleCloseEditModal}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={styles.modalTitle}>Edit Milestone</Text>

          <TextInput
            label="Sr No"
            value={editSrNo.toString()}
            onChangeText={(text) => {
              const num = parseInt(text);
              if (!isNaN(num) && num > 0) {
                setEditSrNo(num);
              }
            }}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Milestone Name *"
            value={editMilestoneName}
            onChangeText={setEditMilestoneName}
            mode="outlined"
            style={styles.input}
            error={!!editErrors.milestoneName}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />
          {editErrors.milestoneName && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {editErrors.milestoneName}
            </Text>
          )}

          <TextInput
            label="Completion Percentage (%)"
            value={editCompletionPercentage.toString()}
            onChangeText={(text) => {
              // Allow only numbers and up to 2 decimal places
              const regex = /^\d+(\.\d{0,2})?$/;
              if (text === '' || regex.test(text)) {
                const value = text === '' ? 0 : parseFloat(text);
                // Ensure value is between 0 and 100
                if (value >= 0 && value <= 100) {
                  setEditCompletionPercentage(value);
                }
              }
            }}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter percentage (0-100)"
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={<TextInput.Affix text="%" />}
          />

          <Text style={styles.sectionTitle}>Status</Text>
          <SegmentedButtons
            value={editStatus}
            onValueChange={(value) => setEditStatus(value as MilestoneStatus)}
            buttons={MILESTONE_STATUS_OPTIONS.map(option => ({
              value: option.value,
              label: option.label,
            }))}
            style={styles.segmentedButtons}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSaveEditedMilestone}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              loading={editLoading}
              disabled={editLoading}
            >
              Save
            </Button>
            <Button
              mode="outlined"
              onPress={handleCloseEditModal}
              style={styles.button}
              disabled={editLoading}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

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
                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('AddMilestone', { scheduleId })}
                    style={styles.addButton}
                    labelStyle={styles.addButtonLabel}
                    icon="plus"
                  >
                    Add Milestone
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      // Create a test milestone for testing the edit modal
                      const testMilestone: Milestone = {
                        id: 999, // Test ID
                        schedule_id: scheduleId,
                        sr_no: 1,
                        milestone_name: 'Test Milestone',
                        completion_percentage: 50,
                        status: 'In Progress',
                      };
                      handleOpenEditModal(testMilestone);
                    }}
                    style={[styles.addButton, { marginLeft: 8 }]}
                    labelStyle={styles.addButtonLabel}
                  >
                    Test Edit
                  </Button>
                </View>
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
                          <StatusChip status={milestone.status} size="small" />
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.actionsColumn}>
                          <View style={styles.actionButtons}>
                            <IconButton
                              icon="pencil"
                              size={18}
                              onPress={() => handleOpenEditModal(milestone)}
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
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  segmentedButtons: {
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.sm,
  },
  table: {
    minWidth: '100%',
    width: 600, // Set a fixed width to ensure proper horizontal scrolling
  },
  tableHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  srNoColumn: {
    width: 60,
    justifyContent: 'center',
  },
  milestoneColumn: {
    width: 200,
    justifyContent: 'center',
  },
  completionColumn: {
    width: 100,
    justifyContent: 'center',
  },
  statusColumn: {
    width: 120,
    justifyContent: 'center',
  },
  actionsColumn: {
    width: 120,
    justifyContent: 'center',
  },
  statusChip: {
    height: 28,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
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
