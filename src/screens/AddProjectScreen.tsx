import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Modal, Portal, Divider, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { Project, ProjectStatus } from '../database/projectsDb';
import { Milestone } from '../database/projectSchedulesDb';
import { addProject } from '../database';
import { addProjectScheduleWithMilestones } from '../database/projectSchedulesDb';
import { spacing, shadows } from '../constants/theme';
import { PROJECT_STATUS_OPTIONS } from '../constants';
import { MilestoneForm } from '../components';

type AddProjectNavigationProp = StackNavigationProp<RootStackParamList>;

const AddProjectScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddProjectNavigationProp>();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [progress, setProgress] = useState('0');
  const [totalBudget, setTotalBudget] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Not Started');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [includeSchedule, setIncludeSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());

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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const newProject: Project = {
        name,
        address: address.trim() || undefined,
        start_date: startDate ? startDate.getTime() : undefined,
        end_date: endDate ? endDate.getTime() : undefined,
        progress: 0, // Progress will be calculated automatically based on milestones
        total_budget: totalBudget ? Number(totalBudget) : undefined,
        status,
      };

      // Add the project
      const projectId = await addProject(newProject);

      // If including a schedule with milestones
      if (includeSchedule && milestones.length > 0) {
        try {
          // Create milestones without schedule_id (will be set in the function)
          const milestonesWithoutScheduleId = milestones.map(({ schedule_id, ...rest }) => rest);

          // Add the schedule with milestones
          await addProjectScheduleWithMilestones(
            projectId,
            scheduleDate.getTime(),
            milestonesWithoutScheduleId
          );
        } catch (scheduleError) {
          console.error('Error adding schedule with milestones:', scheduleError);
          Alert.alert(
            'Warning',
            'Project was created successfully, but there was an error adding the schedule and milestones.'
          );
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error adding project:', error);
      Alert.alert('Error', 'Failed to add project');
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
      setDatePickerDate(scheduleDate);
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
        setScheduleDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    if (currentDateField === 'start') {
      setStartDate(datePickerDate);
    } else if (currentDateField === 'end') {
      setEndDate(datePickerDate);
    } else {
      setScheduleDate(datePickerDate);
    }
    setShowIOSDateModal(false);
  };

  const cancelIOSDate = () => {
    setShowIOSDateModal(false);
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
              Select {currentDateField === 'start' ? 'Start' : currentDateField === 'end' ? 'End' : 'Schedule'} Date
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

        <Card style={[styles.scheduleCard, shadows.md]}>
          <Card.Content>
            <View style={styles.scheduleHeader}>
              <Text variant="titleMedium" style={styles.scheduleTitle}>Add Schedule & Milestones</Text>
              <Button
                mode={includeSchedule ? "contained" : "outlined"}
                onPress={() => setIncludeSchedule(!includeSchedule)}
                style={styles.toggleButton}
              >
                {includeSchedule ? "Enabled" : "Disabled"}
              </Button>
            </View>

            {includeSchedule && (
              <>
                <Divider style={styles.divider} />

                <Text style={styles.sectionTitle}>Schedule Date</Text>
                <Button
                  mode="outlined"
                  onPress={() => showDatePicker('schedule')}
                  style={styles.dateButton}
                  icon="calendar"
                >
                  {formatDate(scheduleDate)}
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
                  milestones={milestones}
                  setMilestones={setMilestones}
                />
              </>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
        >
          Save Project
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
  scheduleCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontWeight: 'bold',
  },
  toggleButton: {
    borderRadius: 20,
  },
  divider: {
    marginVertical: spacing.md,
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
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

export default AddProjectScreen;
