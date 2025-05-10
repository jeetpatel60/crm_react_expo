import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Modal, Portal } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { Project, ProjectStatus } from '../database/projectsDb';
import { updateProject } from '../database';
import { spacing } from '../constants/theme';
import { PROJECT_STATUS_OPTIONS } from '../constants';

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

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showIOSDateModal, setShowIOSDateModal] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<'start' | 'end'>('start');

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
        progress: progress ? Number(progress) : 0,
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

  const showDatePicker = (field: 'start' | 'end') => {
    setCurrentDateField(field);

    // Set initial date in picker based on current value
    if (field === 'start' && startDate) {
      setDatePickerDate(startDate);
    } else if (field === 'end' && endDate) {
      setDatePickerDate(endDate);
    } else {
      setDatePickerDate(new Date());
    }

    if (Platform.OS === 'ios') {
      setShowIOSDateModal(true);
    } else {
      if (field === 'start') {
        setShowStartDatePicker(true);
      } else {
        setShowEndDatePicker(true);
      }
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (currentDateField === 'start') {
        setShowStartDatePicker(false);
      } else {
        setShowEndDatePicker(false);
      }
    }

    if (selectedDate) {
      setDatePickerDate(selectedDate);

      if (currentDateField === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    if (currentDateField === 'start') {
      setStartDate(datePickerDate);
    } else {
      setEndDate(datePickerDate);
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
          label="Progress (%)"
          value={progress}
          onChangeText={setProgress}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.progress}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.progress && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.progress}
          </Text>
        )}

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

export default EditProjectScreen;
