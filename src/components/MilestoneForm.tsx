import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, IconButton, Card, Divider } from 'react-native-paper';

import { Milestone, MilestoneStatus } from '../database/projectSchedulesDb';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { MILESTONE_STATUS_OPTIONS } from '../constants';

interface MilestoneFormProps {
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({ milestones, setMilestones }) => {
  const [milestoneName, setMilestoneName] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [status, setStatus] = useState<MilestoneStatus>('Not Started');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateMilestone = () => {
    const newErrors: { [key: string]: string } = {};

    if (!milestoneName.trim()) {
      newErrors.milestoneName = 'Milestone name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addMilestone = () => {
    if (!validateMilestone()) {
      return;
    }

    const newMilestone: Milestone = {
      schedule_id: 0, // This will be set when the schedule is created
      sr_no: milestones.length + 1,
      milestone_name: milestoneName.trim(),
      completion_percentage: completionPercentage,
      status,
    };

    setMilestones([...milestones, newMilestone]);

    // Reset form
    setMilestoneName('');
    setCompletionPercentage(0);
    setStatus('Not Started');
    setErrors({});
  };

  const removeMilestone = (index: number) => {
    const updatedMilestones = [...milestones];
    updatedMilestones.splice(index, 1);

    // Update sr_no for remaining milestones
    const reorderedMilestones = updatedMilestones.map((milestone, idx) => ({
      ...milestone,
      sr_no: idx + 1,
    }));

    setMilestones(reorderedMilestones);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Milestones</Text>

      {/* Milestone List */}
      {milestones.length > 0 && (
        <View style={styles.milestoneList}>
          {milestones.map((milestone, index) => (
            <Card key={index} style={styles.milestoneCard}>
              <Card.Content style={styles.milestoneCardContent}>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneSrNo}>{milestone.sr_no}.</Text>
                  <View style={styles.milestoneDetails}>
                    <Text style={styles.milestoneName}>{milestone.milestone_name}</Text>
                    <Text style={styles.milestoneSubtext}>
                      {milestone.completion_percentage}% - {milestone.status}
                    </Text>
                  </View>
                </View>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => removeMilestone(index)}
                  style={styles.deleteButton}
                />
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <Divider style={styles.divider} />

      {/* Add New Milestone Form */}
      <Text style={styles.formTitle}>Add New Milestone</Text>

      <TextInput
        label="Milestone Name *"
        value={milestoneName}
        onChangeText={setMilestoneName}
        mode="outlined"
        style={styles.input}
        error={!!errors.milestoneName}
      />
      {errors.milestoneName && (
        <Text style={styles.errorText}>
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
        right={<TextInput.Affix text="%" />}
      />

      <Text style={styles.statusLabel}>Status</Text>
      <SegmentedButtons
        value={status}
        onValueChange={(value) => setStatus(value as MilestoneStatus)}
        buttons={MILESTONE_STATUS_OPTIONS.map(option => ({
          value: option.value,
          label: option.label,
        }))}
        style={styles.segmentedButtons}
      />

      <Button
        mode="contained"
        onPress={addMilestone}
        style={styles.addButton}
        icon="plus"
      >
        Add Milestone
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  milestoneList: {
    marginBottom: spacing.md,
  },
  milestoneCard: {
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  milestoneCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  milestoneSrNo: {
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  milestoneDetails: {
    flex: 1,
  },
  milestoneName: {
    fontWeight: '500',
  },
  milestoneSubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
  deleteButton: {
    margin: 0,
  },
  divider: {
    marginVertical: spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },

  statusLabel: {
    marginBottom: spacing.xs,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  addButton: {
    marginBottom: spacing.md,
  },
});

export default MilestoneForm;
