import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, Menu } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { UnitCustomerSchedule, UnitCustomerScheduleStatus } from '../database/unitCustomerSchedulesDb';
import { updateUnitCustomerSchedule } from '../database/unitCustomerSchedulesDb';
import { getUnitFlatById } from '../database/unitsFlatDb';
import { spacing, shadows } from '../constants/theme';
import { UNIT_CUSTOMER_SCHEDULE_STATUS_OPTIONS } from '../constants';

type EditUnitCustomerScheduleScreenRouteProp = RouteProp<RootStackParamList, 'EditUnitCustomerSchedule'>;
type EditUnitCustomerScheduleNavigationProp = StackNavigationProp<RootStackParamList>;

const EditUnitCustomerScheduleScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditUnitCustomerScheduleNavigationProp>();
  const route = useRoute<EditUnitCustomerScheduleScreenRouteProp>();
  const { schedule } = route.params;

  // Form state
  const [milestone, setMilestone] = useState(schedule.milestone);
  const [completionPercentage, setCompletionPercentage] = useState(schedule.completion_percentage.toString());
  const [status, setStatus] = useState<UnitCustomerScheduleStatus>(schedule.status);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [unitBalance, setUnitBalance] = useState<number>(0);

  // Calculated amount
  const amount = completionPercentage && unitBalance
    ? ((parseFloat(completionPercentage) / 100) * unitBalance).toFixed(2)
    : schedule.amount?.toFixed(2) || '0.00';

  // Load unit details
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get unit details to calculate amount
        const unit = await getUnitFlatById(schedule.unit_id);
        if (unit && unit.balance_amount) {
          setUnitBalance(unit.balance_amount);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load unit data');
      }
    };

    loadData();
  }, [schedule.unit_id]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!milestone.trim()) {
      newErrors.milestone = 'Milestone is required';
    }

    if (!completionPercentage) {
      newErrors.completionPercentage = 'Completion percentage is required';
    } else {
      const percentage = parseFloat(completionPercentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        newErrors.completionPercentage = 'Completion percentage must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const updatedSchedule: UnitCustomerSchedule = {
        ...schedule,
        milestone: milestone.trim(),
        completion_percentage: parseFloat(completionPercentage),
        amount: parseFloat(amount),
        status,
      };

      await updateUnitCustomerSchedule(updatedSchedule);

      Alert.alert('Success', 'Customer schedule updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating customer schedule:', error);
      Alert.alert('Error', 'Failed to update customer schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Milestone *"
          value={milestone}
          onChangeText={setMilestone}
          mode="outlined"
          style={styles.input}
          error={!!errors.milestone}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.milestone && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.milestone}
          </Text>
        )}

        <TextInput
          label="Completion Percentage (%) *"
          value={completionPercentage}
          onChangeText={setCompletionPercentage}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.completionPercentage}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.completionPercentage && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.completionPercentage}
          </Text>
        )}

        <TextInput
          label="Amount"
          value={`₹ ${amount}`}
          mode="outlined"
          style={styles.input}
          disabled
          outlineColor={theme.colors.outline}
        />

        <View style={styles.dropdownContainer}>
          <TextInput
            label="Status"
            value={status}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setStatusMenuVisible(true)}
              />
            }
            onTouchStart={() => setStatusMenuVisible(true)}
          />
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={[styles.menu, { marginTop: 60 }]}
          >
            {UNIT_CUSTOMER_SCHEDULE_STATUS_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setStatus(option.value as UnitCustomerScheduleStatus);
                  setStatusMenuVisible(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Update Schedule
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}
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
    marginBottom: spacing.sm,
  },
  errorText: {
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 12,
  },
  dropdownContainer: {
    marginBottom: spacing.sm,
    position: 'relative',
  },
  menu: {
    width: '90%',
  },
  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.md,
    paddingVertical: 6,
  },
  cancelButton: {
    borderColor: '#ccc',
  },
});

export default EditUnitCustomerScheduleScreen;
