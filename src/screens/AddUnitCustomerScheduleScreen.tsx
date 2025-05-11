import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, Menu } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { UnitCustomerSchedule, UnitCustomerScheduleStatus } from '../database/unitCustomerSchedulesDb';
import { addUnitCustomerSchedule, getUnitCustomerSchedules } from '../database/unitCustomerSchedulesDb';
import { getUnitFlatById } from '../database/unitsFlatDb';
import { spacing, shadows } from '../constants/theme';
import { UNIT_CUSTOMER_SCHEDULE_STATUS_OPTIONS } from '../constants';

type AddUnitCustomerScheduleScreenRouteProp = RouteProp<RootStackParamList, 'AddUnitCustomerSchedule'>;
type AddUnitCustomerScheduleNavigationProp = StackNavigationProp<RootStackParamList>;

const AddUnitCustomerScheduleScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddUnitCustomerScheduleNavigationProp>();
  const route = useRoute<AddUnitCustomerScheduleScreenRouteProp>();
  const { unitId } = route.params;

  // Form state
  const [milestone, setMilestone] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState('');
  const [status, setStatus] = useState<UnitCustomerScheduleStatus>('Not Started');
  const [nextSrNo, setNextSrNo] = useState(1);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [unitBalance, setUnitBalance] = useState<number>(0);

  // Calculated amount
  const amount = completionPercentage && unitBalance
    ? ((parseFloat(completionPercentage) / 100) * unitBalance).toFixed(2)
    : '0.00';

  // Load unit details and get next sr_no
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get unit details to calculate amount
        const unit = await getUnitFlatById(unitId);
        if (unit && unit.balance_amount) {
          setUnitBalance(unit.balance_amount);
        }

        // Get existing schedules to determine next sr_no
        const schedules = await getUnitCustomerSchedules(unitId);
        if (schedules.length > 0) {
          const maxSrNo = Math.max(...schedules.map(s => s.sr_no));
          setNextSrNo(maxSrNo + 1);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load unit data');
      }
    };

    loadData();
  }, [unitId]);

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

      const newSchedule: UnitCustomerSchedule = {
        unit_id: unitId,
        sr_no: nextSrNo,
        milestone: milestone.trim(),
        completion_percentage: parseFloat(completionPercentage),
        amount: parseFloat(amount),
        status,
      };

      await addUnitCustomerSchedule(newSchedule);

      Alert.alert('Success', 'Customer schedule added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding customer schedule:', error);
      Alert.alert('Error', 'Failed to add customer schedule. Please try again.');
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
            Add Schedule
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

export default AddUnitCustomerScheduleScreen;
