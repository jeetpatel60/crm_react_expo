import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Modal, Portal, Card, Divider, DataTable, IconButton, Chip } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { Project, ProjectStatus } from '../database/projectsDb';
import { Milestone, ProjectSchedule } from '../database/projectSchedulesDb';
import { updateProject } from '../database';
import { getProjectSchedulesByProjectId, getMilestonesByScheduleId, addProjectScheduleWithMilestones, updateProjectSchedule, deleteMilestone, updateMilestone } from '../database/projectSchedulesDb';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { PROJECT_STATUS_OPTIONS, MILESTONE_STATUS_COLORS } from '../constants';
import { MilestoneForm } from '../components';

type EditProjectRouteProp = RouteProp<RootStackParamList, 'EditProject'>;
type EditProjectNavigationProp = StackNavigationProp<RootStackParamList>;

const EditProjectScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditProjectNavigationProp>();
  const route = useRoute<EditProjectRouteProp>();
  const { project } = route.params;

  const [name, setName] = useState(project.name);
  const [address, setAddress] = useState(project.address || '');
  const [startDate, setStartDate] = useState<Date | null>(
    project.start_date ? new Date(project.start_date) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    project.end_date ? new Date(project.end_date) : null
  );
  const [progress, setProgress] = useState(
    project.progress !== undefined ? project.progress.toString() : '0'
  );
  const [totalBudget, setTotalBudget] = useState(
    project.total_budget !== undefined ? project.total_budget.toString() : ''
  );
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Schedule and milestones state
  const [schedules, setSchedules] = useState<ProjectSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ProjectSchedule | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([]);
  const [includeNewSchedule, setIncludeNewSchedule] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState<Date>(new Date());
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showScheduleDatePicker, setShowScheduleDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showIOSDateModal, setShowIOSDateModal] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<'start' | 'end' | 'schedule'>('start');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (progress && (isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) {
      newErrors.progress = 'Progress must be a number between 0 and 100';
    }

    if (totalBudget && isNaN(Number(totalBudget))) {
      newErrors.totalBudget = 'Total budget must be a valid number';
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const updatedProject: Project = {
        ...project,
        name,
        address: address.trim() || undefined,
        start_date: startDate ? startDate.getTime() : undefined,
        end_date: endDate ? endDate.getTime() : undefined,
        // Progress is not updated here as it's calculated automatically based on milestones
        total_budget: totalBudget ? Number(totalBudget) : undefined,
        status,
      };

      await updateProject(updatedProject);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const showDatePicker = (field: 'start' | 'end' | 'schedule') => {
    setCurrentDateField(field);

    // Set initial date in picker based on current value
    if (field === 'start' && startDate) {
      setDatePickerDate(startDate);
    } else if (field === 'end' && endDate) {
      setDatePickerDate(endDate);
    } else if (field === 'schedule') {
      setDatePickerDate(newScheduleDate);
    } else {
      setDatePickerDate(new Date());
    }

    if (Platform.OS === 'ios') {
      setShowIOSDateModal(true);
    } else {
      if (field === 'start') {
        setShowStartDatePicker(true);
      } else if (field === 'end') {
        setShowEndDatePicker(true);
      } else {
        setShowScheduleDatePicker(true);
      }
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (currentDateField === 'start') {
        setShowStartDatePicker(false);
      } else if (currentDateField === 'end') {
        setShowEndDatePicker(false);
      } else {
        setShowScheduleDatePicker(false);
      }
    }

    if (selectedDate) {
      setDatePickerDate(selectedDate);

      if (currentDateField === 'start') {
        setStartDate(selectedDate);
      } else if (currentDateField === 'end') {
        setEndDate(selectedDate);
      } else {
        setNewScheduleDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    if (currentDateField === 'start') {
      setStartDate(datePickerDate);
    } else if (currentDateField === 'end') {
      setEndDate(datePickerDate);
    } else {
      setNewScheduleDate(datePickerDate);
    }
    setShowIOSDateModal(false);
  };

  const cancelIOSDate = () => {
    setShowIOSDateModal(false);
  };

  // Load schedules and milestones for the project
  useEffect(() => {
    const loadSchedulesAndMilestones = async () => {
      if (!project.id) return;

      try {
        setLoadingSchedules(true);

        // Load schedules for this project
        const projectSchedules = await getProjectSchedulesByProjectId(project.id);
        setSchedules(projectSchedules);

        // If there are schedules, load milestones for the first one
        if (projectSchedules.length > 0) {
          const firstSchedule = projectSchedules[0];
          setSelectedSchedule(firstSchedule);

          const scheduleMilestones = await getMilestonesByScheduleId(firstSchedule.id!);
          setMilestones(scheduleMilestones);
        }
      } catch (error) {
        console.error('Error loading schedules and milestones:', error);
        Alert.alert('Error', 'Failed to load schedules and milestones');
      } finally {
        setLoadingSchedules(false);
      }
    };

    loadSchedulesAndMilestones();
  }, [project.id]);

  // Load milestones when selected schedule changes
  useEffect(() => {
    const loadMilestones = async () => {
      if (!selectedSchedule || !selectedSchedule.id) return;

      try {
        const scheduleMilestones = await getMilestonesByScheduleId(selectedSchedule.id);
        setMilestones(scheduleMilestones);
      } catch (error) {
        console.error('Error loading milestones:', error);
      }
    };

    loadMilestones();
  }, [selectedSchedule]);

  // Handle selecting a schedule
  const handleSelectSchedule = (schedule: ProjectSchedule) => {
    setSelectedSchedule(schedule);
  };

  // Handle adding a new schedule with milestones
  const handleAddSchedule = async () => {
    if (!project.id || newMilestones.length === 0) return;

    try {
      setLoading(true);

      // Create milestones without schedule_id (will be set in the function)
      const milestonesWithoutScheduleId = newMilestones.map(({ schedule_id, ...rest }) => rest);

      // Add the schedule with milestones
      const scheduleId = await addProjectScheduleWithMilestones(
        project.id,
        newScheduleDate.getTime(),
        milestonesWithoutScheduleId
      );

      // Refresh schedules
      const updatedSchedules = await getProjectSchedulesByProjectId(project.id);
      setSchedules(updatedSchedules);

      // Find and select the newly created schedule
      const newSchedule = updatedSchedules.find(s => s.id === scheduleId);
      if (newSchedule) {
        setSelectedSchedule(newSchedule);
      }

      // Reset new schedule form
      setIncludeNewSchedule(false);
      setNewMilestones([]);

      Alert.alert('Success', 'Schedule and milestones added successfully');
    } catch (error) {
      console.error('Error adding schedule with milestones:', error);
      Alert.alert('Error', 'Failed to add schedule and milestones');
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a milestone
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setShowMilestoneModal(true);
  };

  // Handle saving edited milestone
  const handleSaveMilestone = async () => {
    if (!editingMilestone || !editingMilestone.id) {
      setShowMilestoneModal(false);
      return;
    }

    try {
      setLoading(true);

      await updateMilestone(editingMilestone);

      // Refresh milestones
      if (selectedSchedule && selectedSchedule.id) {
        const updatedMilestones = await getMilestonesByScheduleId(selectedSchedule.id);
        setMilestones(updatedMilestones);
      }

      setShowMilestoneModal(false);
      setEditingMilestone(null);
    } catch (error) {
      console.error('Error updating milestone:', error);
      Alert.alert('Error', 'Failed to update milestone');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a milestone
  const handleDeleteMilestone = async (milestoneId: number) => {
    try {
      await deleteMilestone(milestoneId);

      // Refresh milestones
      if (selectedSchedule && selectedSchedule.id) {
        const updatedMilestones = await getMilestonesByScheduleId(selectedSchedule.id);
        setMilestones(updatedMilestones);
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      Alert.alert('Error', 'Failed to delete milestone');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Project Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.name && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.name}
          </Text>
        )}

        <TextInput
          label="Project Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <Text style={styles.sectionTitle}>Start Date</Text>
        <Button
          mode="outlined"
          onPress={() => showDatePicker('start')}
          style={styles.dateButton}
          icon="calendar"
        >
          {startDate ? formatDate(startDate) : 'Select Start Date'}
        </Button>

        <Text style={styles.sectionTitle}>End Date</Text>
        <Button
          mode="outlined"
          onPress={() => showDatePicker('end')}
          style={styles.dateButton}
          icon="calendar"
        >
          {endDate ? formatDate(endDate) : 'Select End Date'}
        </Button>
        {errors.endDate && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.endDate}
          </Text>
        )}

        {/* Date Pickers */}
        {showStartDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={datePickerDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {showEndDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={datePickerDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* iOS Date Picker Modal */}
        <Portal>
          <Modal
            visible={showIOSDateModal}
            onDismiss={cancelIOSDate}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={styles.modalTitle}>
              Select {currentDateField === 'start' ? 'Start' : 'End'} Date
            </Text>
            <DateTimePicker
              value={datePickerDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              style={styles.iosDatePicker}
            />
            <View style={styles.modalButtons}>
              <Button onPress={cancelIOSDate} style={styles.modalButton}>
                Cancel
              </Button>
              <Button onPress={confirmIOSDate} mode="contained" style={styles.modalButton}>
                Confirm
              </Button>
            </View>
          </Modal>
        </Portal>

        <TextInput
          label="Progress (%) - Calculated from completed milestones"
          value={progress}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          disabled={true}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        <Text style={{ marginTop: -spacing.sm, marginBottom: spacing.sm, fontSize: 12, color: theme.colors.onSurfaceVariant }}>
          Progress is automatically calculated based on completed milestones
        </Text>

        <TextInput
          label="Total Budget"
          value={totalBudget}
          onChangeText={setTotalBudget}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.totalBudget}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.totalBudget && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.totalBudget}
          </Text>
        )}

        <Text style={styles.sectionTitle}>Status</Text>
        <SegmentedButtons
          value={status}
          onValueChange={(value) => setStatus(value as ProjectStatus)}
          buttons={PROJECT_STATUS_OPTIONS.map(option => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.segmentedButtons}
        />

        {/* Schedules and Milestones Section */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Project Schedules</Text>

            {loadingSchedules ? (
              <Text style={styles.loadingText}>Loading schedules...</Text>
            ) : schedules.length === 0 ? (
              <Text style={styles.emptyText}>No schedules found for this project.</Text>
            ) : (
              <>
                <View style={styles.scheduleSelector}>
                  <Text style={styles.sectionTitle}>Select Schedule:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scheduleButtonsContainer}>
                    {schedules.map((schedule) => (
                      <Button
                        key={schedule.id}
                        mode={selectedSchedule?.id === schedule.id ? "contained" : "outlined"}
                        onPress={() => handleSelectSchedule(schedule)}
                        style={styles.scheduleButton}
                      >
                        {formatDate(new Date(schedule.date))}
                      </Button>
                    ))}
                  </ScrollView>
                </View>

                {selectedSchedule && (
                  <View style={styles.milestonesContainer}>
                    <Text style={styles.sectionTitle}>Milestones:</Text>

                    {milestones.length === 0 ? (
                      <Text style={styles.emptyText}>No milestones found for this schedule.</Text>
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
                                    onPress={() => handleEditMilestone(milestone)}
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
                  </View>
                )}
              </>
            )}

            <Divider style={styles.divider} />

            <View style={styles.addScheduleHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>Add New Schedule</Text>
              <Button
                mode={includeNewSchedule ? "contained" : "outlined"}
                onPress={() => setIncludeNewSchedule(!includeNewSchedule)}
                style={styles.toggleButton}
              >
                {includeNewSchedule ? "Enabled" : "Disabled"}
              </Button>
            </View>

            {includeNewSchedule && (
              <>
                <Text style={styles.sectionTitle}>Schedule Date</Text>
                <Button
                  mode="outlined"
                  onPress={() => showDatePicker('schedule')}
                  style={styles.dateButton}
                  icon="calendar"
                >
                  {formatDate(newScheduleDate)}
                </Button>

                {showScheduleDatePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={datePickerDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}

                <MilestoneForm
                  milestones={newMilestones}
                  setMilestones={setNewMilestones}
                />

                <Button
                  mode="contained"
                  onPress={handleAddSchedule}
                  style={styles.addScheduleButton}
                  disabled={newMilestones.length === 0 || loading}
                  loading={loading}
                >
                  Add Schedule with Milestones
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Edit Milestone Modal */}
        <Portal>
          <Modal
            visible={showMilestoneModal}
            onDismiss={() => setShowMilestoneModal(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={styles.modalTitle}>Edit Milestone</Text>

            {editingMilestone && (
              <>
                <TextInput
                  label="Milestone Name"
                  value={editingMilestone.milestone_name}
                  onChangeText={(text) => setEditingMilestone({
                    ...editingMilestone,
                    milestone_name: text
                  })}
                  mode="outlined"
                  style={styles.modalInput}
                />

                <TextInput
                  label="Completion Percentage (%)"
                  value={editingMilestone.completion_percentage.toString()}
                  onChangeText={(text) => {
                    // Allow only numbers and up to 2 decimal places
                    const regex = /^\d+(\.\d{0,2})?$/;
                    if (text === '' || regex.test(text)) {
                      const value = text === '' ? 0 : parseFloat(text);
                      // Ensure value is between 0 and 100
                      if (value >= 0 && value <= 100) {
                        setEditingMilestone({
                          ...editingMilestone,
                          completion_percentage: value
                        });
                      }
                    }
                  }}
                  mode="outlined"
                  style={styles.modalInput}
                  keyboardType="numeric"
                  placeholder="Enter percentage (0-100)"
                  right={<TextInput.Affix text="%" />}
                />

                <Text style={styles.modalLabel}>Status</Text>
                <SegmentedButtons
                  value={editingMilestone.status}
                  onValueChange={(value) => setEditingMilestone({
                    ...editingMilestone,
                    status: value as MilestoneStatus
                  })}
                  buttons={[
                    { value: 'Not Started', label: 'Not Started' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Completed', label: 'Completed' }
                  ]}
                  style={styles.segmentedButtons}
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <Button
                onPress={() => setShowMilestoneModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveMilestone}
                mode="contained"
                style={styles.modalButton}
                loading={loading}
                disabled={loading}
              >
                Save
              </Button>
            </View>
          </Modal>
        </Portal>

        <Button
          mode="contained"
          onPress={handleUpdate}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
        >
          Update Project
        </Button>
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
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  dateButton: {
    marginBottom: spacing.md,
  },
  segmentedButtons: {
    marginBottom: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: spacing.md,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: spacing.md,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  divider: {
    marginVertical: spacing.md,
  },
  scheduleSelector: {
    marginBottom: spacing.md,
  },
  scheduleButtonsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  scheduleButton: {
    marginRight: spacing.sm,
  },
  milestonesContainer: {
    marginBottom: spacing.md,
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
  addScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toggleButton: {
    borderRadius: 20,
  },
  addScheduleButton: {
    marginTop: spacing.md,
  },
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  modalLabel: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },

  iosDatePicker: {
    width: '100%',
    height: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
  },
  modalButton: {
    minWidth: 100,
  },
});

export default EditProjectScreen;
