import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, Menu, Portal, Modal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { ProjectSchedule } from '../database/projectSchedulesDb';
import { Project } from '../database/projectsDb';
import { addProjectSchedule, getProjects } from '../database';
import { spacing, shadows, borderRadius } from '../constants/theme';

type AddProjectScheduleNavigationProp = StackNavigationProp<RootStackParamList>;

const AddProjectScheduleScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddProjectScheduleNavigationProp>();

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
        Alert.alert('Error', 'Failed to load projects');
      }
    };

    loadProjects();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!projectId) {
      newErrors.project = 'Project is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const newSchedule: ProjectSchedule = {
        date: date.getTime(),
        project_id: projectId!,
      };

      await addProjectSchedule(newSchedule);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding project schedule:', error);
      Alert.alert('Error', 'Failed to add project schedule');
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Date</Text>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
          icon="calendar"
        >
          {formatDate(date)}
        </Button>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.sectionTitle}>Project</Text>
        <View style={styles.dropdownContainer}>
          <TextInput
            label="Select Project"
            value={projectName}
            mode="outlined"
            style={styles.input}
            error={!!errors.project}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setProjectMenuVisible(true)}
              />
            }
            onTouchStart={() => setProjectMenuVisible(true)}
          />
          {errors.project && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.project}
            </Text>
          )}
          <Portal>
            <Modal
              visible={projectMenuVisible}
              onDismiss={() => setProjectMenuVisible(false)}
              contentContainerStyle={[
                styles.modalContainer,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Text style={styles.modalTitle}>Select Project</Text>
              <ScrollView style={styles.modalScrollView}>
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    mode="text"
                    onPress={() => {
                      setProjectId(project.id ?? null);
                      setProjectName(project.name);
                      setProjectMenuVisible(false);
                    }}
                    style={styles.projectItem}
                    labelStyle={[
                      styles.projectItemLabel,
                      projectId === project.id && { color: theme.colors.primary }
                    ]}
                  >
                    {project.name}
                  </Button>
                ))}
              </ScrollView>
              <Button
                mode="contained"
                onPress={() => setProjectMenuVisible(false)}
                style={styles.closeButton}
              >
                Close
              </Button>
            </Modal>
          </Portal>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            loading={loading}
            disabled={loading}
          >
            Save
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
            disabled={loading}
          >
            Cancel
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dateButton: {
    marginBottom: spacing.md,
  },
  dropdownContainer: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  input: {
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  projectItem: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  projectItemLabel: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default AddProjectScheduleScreen;
