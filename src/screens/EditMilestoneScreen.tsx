import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Milestone, MilestoneStatus } from '../database/projectSchedulesDb';
import { updateMilestone } from '../database';
import { spacing } from '../constants/theme';
import { MILESTONE_STATUS_OPTIONS } from '../constants';

type EditMilestoneRouteProp = RouteProp<RootStackParamList, 'EditMilestone'>;
type EditMilestoneNavigationProp = StackNavigationProp<RootStackParamList>;

const EditMilestoneScreen = () => {
  const theme = useTheme();
  const route = useRoute<EditMilestoneRouteProp>();
  const navigation = useNavigation<EditMilestoneNavigationProp>();
  const { milestone } = route.params;

  const [milestoneName, setMilestoneName] = useState(milestone.milestone_name);
  const [completionPercentage, setCompletionPercentage] = useState(milestone.completion_percentage);
  const [status, setStatus] = useState<MilestoneStatus>(milestone.status);
  const [srNo, setSrNo] = useState(milestone.sr_no);
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

    try {
      setLoading(true);

      const updatedMilestone: Milestone = {
        ...milestone,
        sr_no: srNo,
        milestone_name: milestoneName.trim(),
        completion_percentage: completionPercentage,
        status,
      };

      await updateMilestone(updatedMilestone);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating milestone:', error);
      Alert.alert('Error', 'Failed to update milestone');
    } finally {
      setLoading(false);
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
