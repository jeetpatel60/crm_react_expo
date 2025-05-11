import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { UnitPaymentRequest } from '../database/unitPaymentRequestsDb';
import { addUnitPaymentRequest, getUnitPaymentRequests } from '../database/unitPaymentRequestsDb';
import { spacing } from '../constants/theme';
import { formatDate } from '../utils/formatters';

type AddUnitPaymentRequestScreenRouteProp = RouteProp<RootStackParamList, 'AddUnitPaymentRequest'>;
type AddUnitPaymentRequestNavigationProp = StackNavigationProp<RootStackParamList>;

const AddUnitPaymentRequestScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddUnitPaymentRequestNavigationProp>();
  const route = useRoute<AddUnitPaymentRequestScreenRouteProp>();
  const { unitId } = route.params;

  // Form state
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [nextSrNo, setNextSrNo] = useState(1);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load existing payment requests to determine next sr_no
  useEffect(() => {
    const loadData = async () => {
      try {
        const requests = await getUnitPaymentRequests(unitId);
        if (requests.length > 0) {
          const maxSrNo = Math.max(...requests.map(r => r.sr_no));
          setNextSrNo(maxSrNo + 1);
        }
      } catch (error) {
        console.error('Error loading payment requests:', error);
      }
    };

    loadData();
  }, [unitId]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
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

      const newRequest: UnitPaymentRequest = {
        unit_id: unitId,
        sr_no: nextSrNo,
        date: date.getTime(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
      };

      await addUnitPaymentRequest(newRequest);

      Alert.alert('Success', 'Payment request added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding payment request:', error);
      Alert.alert('Error', 'Failed to add payment request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
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
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Amount *"
          value={amount}
          onChangeText={setAmount}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.amount}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.amount && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.amount}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Add Payment Request
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
  datePickerContainer: {
    marginBottom: spacing.sm,
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

export default AddUnitPaymentRequestScreen;
