import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { UnitPaymentRequest } from '../database/unitPaymentRequestsDb';
import { updateUnitPaymentRequest } from '../database/unitPaymentRequestsDb';
import { spacing } from '../constants/theme';
import { formatDate } from '../utils/formatters';

type EditUnitPaymentRequestScreenRouteProp = RouteProp<RootStackParamList, 'EditUnitPaymentRequest'>;
type EditUnitPaymentRequestNavigationProp = StackNavigationProp<RootStackParamList>;

const EditUnitPaymentRequestScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditUnitPaymentRequestNavigationProp>();
  const route = useRoute<EditUnitPaymentRequestScreenRouteProp>();
  const { request } = route.params;

  // Form state
  const [date, setDate] = useState(new Date(request.date));
  const [description, setDescription] = useState(request.description || '');
  const [amount, setAmount] = useState(request.amount.toString());
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

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

      const updatedRequest: UnitPaymentRequest = {
        ...request,
        date: date.getTime(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
      };

      await updateUnitPaymentRequest(updatedRequest);

      Alert.alert('Success', 'Payment request updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating payment request:', error);
      Alert.alert('Error', 'Failed to update payment request. Please try again.');
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
            Update Payment Request
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

export default EditUnitPaymentRequestScreen;
