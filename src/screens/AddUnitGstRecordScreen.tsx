import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { UnitGstRecord } from '../database/unitGstRecordsDb';
import { addUnitGstRecord, getNextGstSerialNumber } from '../database/unitGstRecordsDb';
import { spacing } from '../constants/theme';
import { formatDate } from '../utils/formatters';

type AddUnitGstRecordScreenRouteProp = RouteProp<RootStackParamList, 'AddUnitGstRecord'>;
type AddUnitGstRecordNavigationProp = StackNavigationProp<RootStackParamList>;



const AddUnitGstRecordScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddUnitGstRecordNavigationProp>();
  const route = useRoute<AddUnitGstRecordScreenRouteProp>();
  const { unitId } = route.params;

  // Form state
  const [date, setDate] = useState(new Date());
  const [remarks, setRemarks] = useState('');
  const [rAmount, setRAmount] = useState('');
  const [nextSrNo, setNextSrNo] = useState(1);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadNextSerialNumber();
  }, []);

  const loadNextSerialNumber = async () => {
    try {
      const nextSr = await getNextGstSerialNumber(unitId);
      setNextSrNo(nextSr);
    } catch (error) {
      console.error('Error loading next serial number:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (rAmount.trim() && (isNaN(parseFloat(rAmount)) || parseFloat(rAmount) < 0)) {
      newErrors.rAmount = 'R. Amount must be a valid non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const newGstRecord: UnitGstRecord = {
        unit_id: unitId,
        sr_no: nextSrNo,
        date: date.getTime(),
        remarks: remarks.trim() || undefined,
        r_amount: parseFloat(rAmount) || 0,
      };

      await addUnitGstRecord(newGstRecord);

      Alert.alert(
        'Success',
        'GST record added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding GST record:', error);
      Alert.alert('Error', 'Failed to add GST record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.datePickerContainer}>
          <TextInput
            label="Date *"
            value={formatDate(date.getTime())}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="calendar"
                onPress={() => setShowDatePicker(true)}
              />
            }
            onTouchStart={() => setShowDatePicker(true)}
            editable={false}
          />
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>

        <TextInput
          label="R. Amount"
          value={rAmount}
          onChangeText={setRAmount}
          mode="outlined"
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          keyboardType="numeric"
          error={!!errors.rAmount}
        />
        {errors.rAmount && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.rAmount}
          </Text>
        )}

        <TextInput
          label="Remarks"
          value={remarks}
          onChangeText={setRemarks}
          mode="outlined"
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          multiline
          numberOfLines={3}
        />



        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Add GST Record
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={[styles.button, styles.cancelButton]}
            contentStyle={styles.buttonContent}
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
  datePickerContainer: {
    marginBottom: spacing.sm,
  },

  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  cancelButton: {
    borderColor: '#ccc',
  },
});

export default AddUnitGstRecordScreen;
