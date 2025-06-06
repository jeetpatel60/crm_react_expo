import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Modal, Portal, Card, Divider, DataTable, IconButton, Chip, FAB } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { Project, ProjectStatus, getProjectById } from '../database/projectsDb';
import { Milestone, ProjectSchedule, MilestoneStatus } from '../database/projectSchedulesDb';
import { Company } from '../database/companiesDb';
import { updateProject } from '../database';
import { getProjectSchedulesByProjectId, getMilestonesByScheduleId, updateProjectSchedule, deleteMilestone, updateMilestone, addProjectScheduleWithMilestones } from '../database/projectSchedulesDb';
import { getCompanies } from '../database/companiesDb';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { PROJECT_STATUS_OPTIONS, MILESTONE_STATUS_COLORS, MILESTONE_STATUS_OPTIONS } from '../constants';
import MilestoneForm from '../components/MilestoneForm';

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
    project.progress !== undefined && project.progress !== null ? project.progress.toString() : '0'
  );
  const [totalBudget, setTotalBudget] = useState(
    project.total_budget !== undefined && project.total_budget !== null ? project.total_budget.toString() : ''
  );
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Company dropdown state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(project.company_id || null);
  const [companyName, setCompanyName] = useState('');
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);

  // Schedule and milestones state
  const [schedules, setSchedules] = useState<ProjectSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ProjectSchedule | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Inline editing state
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [editMilestoneName, setEditMilestoneName] = useState('');
  const [editCompletionPercentage, setEditCompletionPercentage] = useState(0);
  const [editStatus, setEditStatus] = useState<MilestoneStatus>('Not Started');
  const [editSrNo, setEditSrNo] = useState(1);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});


  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showIOSDateModal, setShowIOSDateModal] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<'start' | 'end' | 'schedule'>('start');

  // Add schedule state
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState(new Date());
  const [newScheduleMilestones, setNewScheduleMilestones] = useState<Omit<Milestone, 'schedule_id'>[]>([]);
  const [showScheduleDatePicker, setShowScheduleDatePicker] = useState(false);
  const [addingSchedule, setAddingSchedule] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!totalBudget.trim()) {
      newErrors.totalBudget = 'Total budget is required';
    } else if (isNaN(Number(totalBudget))) {
      newErrors.totalBudget = 'Total budget must be a valid number';
    }

    if (progress && (isNaN(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) {
      newErrors.progress = 'Progress must be a number between 0 and 100';
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

      // Get the latest progress value from the database before updating
      let currentProgress = Number(progress);
      if (project.id) {
        try {
          const currentProject = await getProjectById(project.id);
          if (currentProject && currentProject.progress !== undefined) {
            currentProgress = currentProject.progress;
            console.log(`Using latest progress from database: ${currentProgress}%`);
          }
        } catch (error) {
          console.error('Error getting current project progress:', error);
        }
      }

      const updatedProject: Project = {
        ...project,
        name,
        address: address.trim() || undefined,
        start_date: startDate ? startDate.getTime() : undefined,
        end_date: endDate ? endDate.getTime() : undefined,
        progress: currentProgress, // Use the current progress value from the database
        total_budget: totalBudget ? Number(totalBudget) : undefined,
        status,
        company_id: companyId || undefined,
      };

      console.log(`Updating project with progress: ${updatedProject.progress}%`);
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
      } else if (field === 'schedule') {
        setShowScheduleDatePicker(true);
      }
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (currentDateField === 'start') {
        setShowStartDatePicker(false);
      } else if (currentDateField === 'end') {
        setShowEndDatePicker(false);
      } else if (currentDateField === 'schedule') {
        setShowScheduleDatePicker(false);
      }
    }

    if (selectedDate) {
      setDatePickerDate(selectedDate);

      if (currentDateField === 'start') {
        setStartDate(selectedDate);
      } else if (currentDateField === 'end') {
        setEndDate(selectedDate);
      } else if (currentDateField === 'schedule') {
        setNewScheduleDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    if (currentDateField === 'start') {
      setStartDate(datePickerDate);
    } else if (currentDateField === 'end') {
      setEndDate(datePickerDate);
    } else if (currentDateField === 'schedule') {
      setNewScheduleDate(datePickerDate);
    }
    setShowIOSDateModal(false);
  };

  const cancelIOSDate = () => {
    setShowIOSDateModal(false);
  };

  // Load companies for dropdown and set initial company name
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await getCompanies();
        setCompanies(companiesData);

        // Set initial company name if company_id exists
        if (project.company_id) {
          const selectedCompany = companiesData.find(c => c.id === project.company_id);
          if (selectedCompany) {
            setCompanyName(selectedCompany.name);
          }
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        Alert.alert('Error', 'Failed to load companies');
      }
    };

    loadCompanies();
  }, [project.company_id]);

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

  // Refresh milestones and project progress when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        // Refresh milestones if a schedule is selected
        if (selectedSchedule && selectedSchedule.id) {
          try {
            console.log('Refreshing milestones for schedule:', selectedSchedule.id);
            const scheduleMilestones = await getMilestonesByScheduleId(selectedSchedule.id);
            console.log('Fetched milestones:', scheduleMilestones.length);
            setMilestones(scheduleMilestones);
          } catch (error) {
            console.error('Error refreshing milestones:', error);
          }
        }

        // Refresh project progress
        if (project.id) {
          try {
            console.log('Refreshing project progress data');
            const updatedProject = await getProjectById(project.id);
            if (updatedProject && updatedProject.progress !== undefined && updatedProject.progress !== null) {
              console.log(`Updated project progress: ${updatedProject.progress}%`);
              setProgress(updatedProject.progress.toString());
            }
          } catch (error) {
            console.error('Error refreshing project progress:', error);
          }
        }
      };

      refreshData();

      // Return a cleanup function
      return () => {
        // This will run when the component unmounts or before the effect runs again
        console.log('Cleanup focus effect');
      };
    }, [selectedSchedule, project.id])
  );

  // Handle selecting a schedule
  const handleSelectSchedule = (schedule: ProjectSchedule) => {
    setSelectedSchedule(schedule);
  };

  // Handle opening add schedule modal
  const handleOpenAddScheduleModal = () => {
    setNewScheduleDate(new Date());
    setNewScheduleMilestones([]);
    setShowAddScheduleModal(true);
  };

  // Handle closing add schedule modal
  const handleCloseAddScheduleModal = () => {
    setShowAddScheduleModal(false);
    setNewScheduleDate(new Date());
    setNewScheduleMilestones([]);
  };

  // Handle adding new schedule
  const handleAddSchedule = async () => {
    if (!project.id) {
      Alert.alert('Error', 'Project ID is required');
      return;
    }

    try {
      setAddingSchedule(true);

      // Add the schedule with milestones
      const scheduleId = await addProjectScheduleWithMilestones(
        project.id,
        newScheduleDate.getTime(),
        newScheduleMilestones
      );

      // Refresh schedules
      const projectSchedules = await getProjectSchedulesByProjectId(project.id);
      setSchedules(projectSchedules);

      // Select the newly created schedule
      const newSchedule = projectSchedules.find(s => s.id === scheduleId);
      if (newSchedule) {
        setSelectedSchedule(newSchedule);
        // Load milestones for the new schedule
        const scheduleMilestones = await getMilestonesByScheduleId(scheduleId);
        setMilestones(scheduleMilestones);
      }

      // Close modal
      handleCloseAddScheduleModal();

      Alert.alert('Success', 'Schedule added successfully');
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('Error', 'Failed to add schedule');
    } finally {
      setAddingSchedule(false);
    }
  };



  // Start inline editing for a milestone
  const handleStartEditMilestone = (milestone: Milestone) => {
    setEditingMilestoneId(milestone.id || null);
    setEditMilestoneName(milestone.milestone_name || '');
    setEditCompletionPercentage(milestone.completion_percentage || 0);
    setEditStatus(milestone.status);
    setEditSrNo(milestone.sr_no || 1);
    setEditErrors({});
  };

  // Cancel inline editing
  const handleCancelEdit = () => {
    setEditingMilestoneId(null);
    setEditErrors({});
  };

  // Validate the edit form
  const validateEditForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!editMilestoneName.trim()) {
      newErrors.milestoneName = 'Milestone name is required';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save the edited milestone
  const handleSaveEditedMilestone = async (milestone: Milestone) => {
    if (!validateEditForm()) {
      return;
    }

    // Create the updated milestone object
    const updatedMilestone: Milestone = {
      ...milestone,
      sr_no: editSrNo,
      milestone_name: editMilestoneName.trim(),
      completion_percentage: editCompletionPercentage,
      status: editStatus,
    };

    // Check if status is changing to "Completed"
    const statusChangingToCompleted = milestone.status !== 'Completed' && editStatus === 'Completed';

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

                // Add a small delay to ensure the database update completes
                setTimeout(async () => {
                  // Refresh the milestones list
                  if (selectedSchedule && selectedSchedule.id) {
                    const updatedMilestones = await getMilestonesByScheduleId(selectedSchedule.id);
                    setMilestones(updatedMilestones);
                  }

                  // Refresh project data to get updated progress
                  if (project.id) {
                    try {
                      // Get fresh project data with updated progress
                      const updatedProject = await getProjectById(project.id);
                      if (updatedProject) {
                        console.log(`Project progress updated: ${updatedProject.progress}%`);
                        // Update the progress field in the UI
                        setProgress(updatedProject.progress?.toString() || '0');
                      }
                    } catch (error) {
                      console.error('Error refreshing project data:', error);
                    }
                  }

                  // Reset editing state
                  setEditingMilestoneId(null);
                  setEditLoading(false);
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
          // Refresh the milestones list
          if (selectedSchedule && selectedSchedule.id) {
            const updatedMilestones = await getMilestonesByScheduleId(selectedSchedule.id);
            setMilestones(updatedMilestones);
          }

          // Refresh project data to get updated progress
          if (project.id) {
            try {
              const updatedProject = await getProjectById(project.id);
              if (updatedProject) {
                console.log(`Project data after non-completion status change: ${updatedProject.progress}%`);
                // Update the progress field in the UI
                setProgress(updatedProject.progress?.toString() || '0');
              }
            } catch (error) {
              console.error('Error refreshing project data:', error);
            }
          }

          // Reset editing state
          setEditingMilestoneId(null);
          setEditLoading(false);
        }, 300);
      } catch (error) {
        console.error('Error updating milestone:', error);
        Alert.alert('Error', 'Failed to update milestone');
        setEditLoading(false);
      }
    }
  };

  // Navigate to EditMilestoneScreen (keeping this as an alternative for future use)
  // This function is currently unused but kept for potential future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNavigateToEditMilestone = (milestone: Milestone) => {
    navigation.navigate('EditMilestone', { milestone });
  };

  // Handle deleting a milestone
  const handleDeleteMilestone = async (milestoneId: number) => {
    try {
      await deleteMilestone(milestoneId);

      // Add a small delay to ensure the database update completes
      setTimeout(async () => {
        // Refresh milestones
        if (selectedSchedule && selectedSchedule.id) {
          const updatedMilestones = await getMilestonesByScheduleId(selectedSchedule.id);
          setMilestones(updatedMilestones);
        }

        // Refresh project data to get updated progress
        if (project.id) {
          try {
            const updatedProject = await getProjectById(project.id);
            if (updatedProject) {
              console.log(`Project progress after milestone deletion: ${updatedProject.progress}%`);
              // Update the progress field in the UI
              setProgress(updatedProject.progress?.toString() || '0');
            }
          } catch (error) {
            console.error('Error refreshing project data after milestone deletion:', error);
          }
        }
      }, 300);
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
          label="Total Budget *"
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

        <Text style={styles.sectionTitle}>Company</Text>
        <View style={styles.dropdownContainer}>
          <TextInput
            label="Select Company"
            value={companyName}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setCompanyMenuVisible(true)}
              />
            }
            onTouchStart={() => setCompanyMenuVisible(true)}
          />
          <Portal>
            <Modal
              visible={companyMenuVisible}
              onDismiss={() => setCompanyMenuVisible(false)}
              contentContainerStyle={[
                styles.modalContainer,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Text style={styles.modalTitle}>Select Company</Text>
              <ScrollView style={styles.modalScrollView}>
                {companies.map((company) => (
                  <Button
                    key={company.id}
                    mode="text"
                    onPress={() => {
                      setCompanyId(company.id || null);
                      setCompanyName(company.name);
                      setCompanyMenuVisible(false);
                    }}
                    style={styles.modalButton}
                  >
                    {company.name}
                  </Button>
                ))}
              </ScrollView>
              <Button
                mode="contained"
                onPress={() => setCompanyMenuVisible(false)}
                style={styles.modalCloseButton}
              >
                Close
              </Button>
            </Modal>
          </Portal>

          {/* Add Schedule Modal */}
          <Portal>
            <Modal
              visible={showAddScheduleModal}
              onDismiss={handleCloseAddScheduleModal}
              contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
            >
              <ScrollView style={styles.modalScrollView}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Add New Schedule</Text>

                <Text style={[styles.modalLabel, { color: theme.colors.onSurface }]}>Schedule Date</Text>
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
                  milestones={newScheduleMilestones.map(m => ({ ...m, schedule_id: 0 }))}
                  setMilestones={(milestones) => setNewScheduleMilestones(milestones.map(({ schedule_id, ...rest }) => rest))}
                />

                <View style={styles.modalButtons}>
                  <Button
                    mode="contained"
                    onPress={handleAddSchedule}
                    style={styles.modalButton}
                    loading={addingSchedule}
                    disabled={addingSchedule}
                  >
                    Add Schedule
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleCloseAddScheduleModal}
                    style={styles.modalButton}
                    disabled={addingSchedule}
                  >
                    Cancel
                  </Button>
                </View>
              </ScrollView>
            </Modal>
          </Portal>
        </View>

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
              <View style={styles.emptyScheduleContainer}>
                <Text style={styles.emptyText}>No schedules found for this project.</Text>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={handleOpenAddScheduleModal}
                  style={styles.addScheduleButton}
                >
                  Add Schedule
                </Button>
              </View>
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
                    <View style={styles.milestoneTitleRow}>
                      <Text style={styles.sectionTitle}>Milestones:</Text>
                      <Button
                        mode="contained"
                        icon="plus"
                        onPress={() => {
                          if (selectedSchedule.id) {
                            navigation.navigate('AddMilestone', { scheduleId: selectedSchedule.id });
                          }
                        }}
                        style={styles.addMilestoneButton}
                      >
                        Add Milestone
                      </Button>
                    </View>

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
                              {editingMilestoneId === milestone.id ? (
                                // Editing mode
                                <>
                                  <DataTable.Cell style={styles.srNoColumn}>
                                    <TextInput
                                      value={(editSrNo || 1).toString()}
                                      onChangeText={(text) => {
                                        const num = parseInt(text);
                                        if (!isNaN(num) && num > 0) {
                                          setEditSrNo(num);
                                        }
                                      }}
                                      mode="outlined"
                                      style={styles.editInput}
                                      keyboardType="numeric"
                                      dense
                                    />
                                  </DataTable.Cell>
                                  <DataTable.Cell style={styles.milestoneColumn}>
                                    <TextInput
                                      value={editMilestoneName}
                                      onChangeText={setEditMilestoneName}
                                      mode="outlined"
                                      style={styles.editInput}
                                      error={!!editErrors.milestoneName}
                                      dense
                                    />
                                    {editErrors.milestoneName && (
                                      <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                        {editErrors.milestoneName}
                                      </Text>
                                    )}
                                  </DataTable.Cell>
                                  <DataTable.Cell style={styles.completionColumn}>
                                    <TextInput
                                      value={(editCompletionPercentage || 0).toString()}
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
                                      style={styles.editInput}
                                      keyboardType="numeric"
                                      dense
                                      right={<TextInput.Affix text="%" />}
                                    />
                                  </DataTable.Cell>
                                  <DataTable.Cell style={styles.statusColumn}>
                                    <View style={styles.statusDropdownContainer}>
                                      <Button
                                        mode="outlined"
                                        onPress={() => {
                                          // Toggle through status options
                                          const currentIndex = MILESTONE_STATUS_OPTIONS.findIndex(option => option.value === editStatus);
                                          const nextIndex = (currentIndex + 1) % MILESTONE_STATUS_OPTIONS.length;
                                          setEditStatus(MILESTONE_STATUS_OPTIONS[nextIndex].value as MilestoneStatus);
                                        }}
                                        style={[
                                          styles.statusButton,
                                          { backgroundColor: MILESTONE_STATUS_COLORS[editStatus] + '20' }
                                        ]}
                                        labelStyle={{
                                          color: MILESTONE_STATUS_COLORS[editStatus],
                                          fontSize: 12
                                        }}
                                        compact
                                      >
                                        {editStatus}
                                      </Button>
                                    </View>
                                  </DataTable.Cell>
                                  <DataTable.Cell style={styles.actionsColumn}>
                                    <View style={styles.actionButtons}>
                                      <IconButton
                                        icon="check"
                                        size={18}
                                        onPress={() => handleSaveEditedMilestone(milestone)}
                                        iconColor={theme.colors.primary}
                                        style={styles.actionButton}
                                        disabled={editLoading}
                                        loading={editLoading}
                                      />
                                      <IconButton
                                        icon="close"
                                        size={18}
                                        onPress={handleCancelEdit}
                                        iconColor={theme.colors.error}
                                        style={styles.actionButton}
                                        disabled={editLoading}
                                      />
                                    </View>
                                  </DataTable.Cell>
                                </>
                              ) : (
                                // View mode
                                <>
                                  <DataTable.Cell style={styles.srNoColumn}>{milestone.sr_no}</DataTable.Cell>
                                  <DataTable.Cell style={styles.milestoneColumn}>{milestone.milestone_name}</DataTable.Cell>
                                  <DataTable.Cell style={styles.completionColumn}>{milestone.completion_percentage}%</DataTable.Cell>
                                  <DataTable.Cell style={styles.statusColumn}>
                                    <Chip
                                      style={[
                                        styles.statusChip,
                                        {
                                          backgroundColor: MILESTONE_STATUS_COLORS[milestone.status] + '20',
                                          paddingHorizontal: 0,
                                          paddingVertical: 0
                                        }
                                      ]}
                                      textStyle={{
                                        color: MILESTONE_STATUS_COLORS[milestone.status],
                                        textAlign: 'center',
                                        textAlignVertical: 'center',
                                        paddingHorizontal: 0,
                                        paddingVertical: 0
                                      }}
                                    >
                                      {milestone.status}
                                    </Chip>
                                  </DataTable.Cell>
                                  <DataTable.Cell style={styles.actionsColumn}>
                                    <View style={styles.actionButtons}>
                                      <IconButton
                                        icon="pencil"
                                        size={18}
                                        onPress={() => handleStartEditMilestone(milestone)}
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
                                </>
                              )}
                            </DataTable.Row>
                          ))}
                        </DataTable>
                      </ScrollView>
                    )}
                  </View>
                )}
              </>
            )}


          </Card.Content>
        </Card>



      </ScrollView>

      <FAB
        icon="content-save"
        label="Update"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={handleUpdate}
        loading={loading}
        disabled={loading}
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
    paddingBottom: 100, // Extra padding for FAB
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
  fab: {
    position: 'absolute',
    margin: spacing.md,
    left: 0,
    bottom: spacing.lg,
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
  emptyScheduleContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  addScheduleButton: {
    marginTop: spacing.md,
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
  milestoneTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addMilestoneButton: {
    marginLeft: spacing.sm,
  },
  tableContainer: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.sm,
  },
  table: {
    minWidth: '100%',
    width: 620, // Increased width to accommodate all columns
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
    width: 180,
    justifyContent: 'center',
  },
  completionColumn: {
    width: 100,
    justifyContent: 'center',
  },
  statusColumn: {
    width: 140,
    justifyContent: 'center',
    paddingHorizontal: 4,
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

  editInput: {
    fontSize: 14,
    height: 40,
    width: '100%',
    backgroundColor: 'transparent',
  },
  statusDropdownContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButton: {
    height: 36,
    width: '100%',
    borderRadius: 4,
    justifyContent: 'center',
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
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  modalCloseButton: {
    marginTop: spacing.md,
  },
  dropdownContainer: {
    marginBottom: spacing.md,
  },
  modalScrollView: {
    maxHeight: 300,
    width: '100%',
  },
});

export default EditProjectScreen;
