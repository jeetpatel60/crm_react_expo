import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Milestone, MilestoneStatus, updateMilestone } from '../database/projectSchedulesDb';
import { db } from '../database/database';
import { spacing } from '../constants/theme';
import { MILESTONE_STATUS_OPTIONS } from '../constants';

type EditMilestoneRouteProp = RouteProp<RootStackParamList, 'EditMilestone'>;
type EditMilestoneNavigationProp = StackNavigationProp<RootStackParamList>;

const EditMilestoneScreen = () => {
  console.log('EditMilestoneScreen rendering');
  const theme = useTheme();
  const route = useRoute<EditMilestoneRouteProp>();
  const navigation = useNavigation<EditMilestoneNavigationProp>();

  console.log('Route params:', route.params);

  // Get milestone from route params with error handling
  let milestoneData: Milestone | null = null;
  try {
    milestoneData = route.params.milestone;
    console.log('Milestone from route params:', milestoneData);
  } catch (error) {
    console.error('Error accessing milestone from route params:', error);
    // We'll handle this below
  }

  // If milestone data is missing or invalid, show an error and go back
  if (!milestoneData) {
    console.error('Milestone data is missing or invalid');
    // Use setTimeout to avoid calling hooks conditionally
    setTimeout(() => {
      Alert.alert('Error', 'Failed to load milestone data', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 100);

    // Provide default values to prevent crashes
    milestoneData = {
      schedule_id: 0,
      sr_no: 1,
      milestone_name: '',
      completion_percentage: 0,
      status: 'Not Started'
    };
  }

  // Now we can safely use the milestone data for our state
  const [milestoneName, setMilestoneName] = useState(milestoneData.milestone_name);
  const [completionPercentage, setCompletionPercentage] = useState(milestoneData.completion_percentage);
  const [status, setStatus] = useState<MilestoneStatus>(milestoneData.status);
  const [srNo, setSrNo] = useState(milestoneData.sr_no);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!milestoneName.trim()) {
      newErrors.milestoneName = 'Milestone name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Make sure we preserve the schedule_id and id from the original milestone
    const updatedMilestone: Milestone = {
      ...milestoneData,
      sr_no: srNo,
      milestone_name: milestoneName.trim(),
      completion_percentage: completionPercentage,
      status,
      schedule_id: milestoneData.schedule_id, // Explicitly include schedule_id to ensure it's preserved
    };

    console.log('Original milestone:', milestoneData);
    console.log('Updating milestone with new values:', updatedMilestone);

    // Check if status is changing to "Completed"
    const statusChangingToCompleted = milestoneData.status !== 'Completed' && status === 'Completed';

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
                setLoading(true);
                console.log('Status is changing to Completed - updating project progress');
                console.log('Original status:', milestoneData.status);
                console.log('New status:', status);

                // Update the milestone
                await updateMilestone(updatedMilestone);
                console.log('Milestone updated successfully');

                // Verify the project progress was updated
                try {
                  // Get the schedule to find the project_id
                  const scheduleData = await db.getFirstAsync<{ project_id: number }>(
                    'SELECT project_id FROM project_schedules WHERE id = ?;',
                    [milestoneData.schedule_id]
                  );

                  if (scheduleData) {
                    // Get the project progress directly from the database
                    const projectData = await db.getFirstAsync<{ progress: number }>(
                      'SELECT progress FROM projects WHERE id = ?;',
                      [scheduleData.project_id]
                    );

                    console.log(`Direct verification: Project progress is now ${projectData?.progress}%`);

                    // Show a success message with the updated progress
                    Alert.alert(
                      'Project Progress Updated',
                      `The project progress has been updated to ${projectData?.progress || 0}%.`,
                      [{ text: 'OK' }]
                    );
                  }
                } catch (verifyError) {
                  console.error('Error verifying project progress:', verifyError);
                }

                // Add a longer delay to ensure the database update completes
                setTimeout(() => {
                  console.log('Navigation delay completed, returning to previous screen');
                  // Return to the previous screen
                  navigation.goBack();
                }, 1000); // Increased delay to ensure database operations complete
              } catch (error) {
                console.error('Error updating milestone:', error);
                Alert.alert('Error', 'Failed to update milestone');
                setLoading(false);
              }
            }
          }
        ]
      );
    } else {
      // For non-completion status changes, proceed without confirmation
      try {
        setLoading(true);

        // Update the milestone
        await updateMilestone(updatedMilestone);
        console.log('Milestone updated successfully');

        // Add a delay to ensure the database update completes
        setTimeout(() => {
          console.log('Navigation delay completed, returning to previous screen');
          // Return to the previous screen
          navigation.goBack();
        }, 500);
      } catch (error) {
        console.error('Error updating milestone:', error);
        Alert.alert('Error', 'Failed to update milestone');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Sr No"
          value={srNo.toString()}
          onChangeText={(text) => {
            const num = parseInt(text);
            if (!isNaN(num) && num > 0) {
              setSrNo(num);
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
          value={milestoneName}
          onChangeText={setMilestoneName}
          mode="outlined"
          style={styles.input}
          error={!!errors.milestoneName}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.milestoneName && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.milestoneName}
          </Text>
        )}

        <TextInput
          label="Completion Percentage (%)"
          value={completionPercentage.toString()}
          onChangeText={(text) => {
            // Allow only numbers and up to 2 decimal places
            const regex = /^\d+(\.\d{0,2})?$/;
            if (text === '' || regex.test(text)) {
              const value = text === '' ? 0 : parseFloat(text);
              // Ensure value is between 0 and 100
              if (value >= 0 && value <= 100) {
                setCompletionPercentage(value);
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
          value={status}
          onValueChange={(value) => setStatus(value as MilestoneStatus)}
          buttons={MILESTONE_STATUS_OPTIONS.map(option => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.segmentedButtons}
        />

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
  input: {
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },

  segmentedButtons: {
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default EditMilestoneScreen;
