import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, Menu } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { UnitPaymentReceipt } from '../database/unitPaymentReceiptsDb';
import { updateUnitPaymentReceipt } from '../database/unitPaymentReceiptsDb';
import { spacing } from '../constants/theme';
import { formatDate } from '../utils/formatters';

type EditUnitPaymentReceiptScreenRouteProp = RouteProp<RootStackParamList, 'EditUnitPaymentReceipt'>;
type EditUnitPaymentReceiptNavigationProp = StackNavigationProp<RootStackParamList>;

// Payment mode options
const PAYMENT_MODES = [
  'Cash',
  'Cheque',
  'Bank Transfer',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Other'
];

const EditUnitPaymentReceiptScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditUnitPaymentReceiptNavigationProp>();
  const route = useRoute<EditUnitPaymentReceiptScreenRouteProp>();
  const { receipt } = route.params;

  // Form state
  const [date, setDate] = useState(new Date(receipt.date));
  const [description, setDescription] = useState(receipt.description || '');
  const [amount, setAmount] = useState(receipt.amount.toString());
  const [mode, setMode] = useState(receipt.mode || '');
  const [remarks, setRemarks] = useState(receipt.remarks || '');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modeMenuVisible, setModeMenuVisible] = useState(false);

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
      console.log(`Preparing to update payment receipt ID: ${receipt.id}`);

      const updatedReceipt: UnitPaymentReceipt = {
        ...receipt,
        date: date.getTime(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        mode: mode.trim() || undefined,
        remarks: remarks.trim() || undefined,
        // Explicitly preserve the payment_request_id if it exists
        payment_request_id: receipt.payment_request_id,
      };

      console.log(`Sending update for receipt:`, JSON.stringify(updatedReceipt));
      await updateUnitPaymentReceipt(updatedReceipt);

      console.log(`Payment receipt updated successfully: ${receipt.id}`);
      Alert.alert('Success', 'Payment receipt updated successfully');
      navigation.goBack();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error updating payment receipt ID ${receipt.id}:`, error);
      Alert.alert(
        'Error',
        `Failed to update payment receipt: ${errorMessage}. Please check the console for more details.`
      );
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

        <View style={styles.dropdownContainer}>
          <TextInput
            label="Payment Mode"
            value={mode}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setModeMenuVisible(true)}
              />
            }
            onTouchStart={() => setModeMenuVisible(true)}
          />
          <Menu
            visible={modeMenuVisible}
            onDismiss={() => setModeMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={[styles.menu, { marginTop: 60 }]}
          >
            {PAYMENT_MODES.map((option) => (
              <Menu.Item
                key={option}
                onPress={() => {
                  setMode(option);
                  setModeMenuVisible(false);
                }}
                title={option}
              />
            ))}
          </Menu>
        </View>

        <TextInput
          label="Remarks"
          value={remarks}
          onChangeText={setRemarks}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Update Payment Receipt
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

export default EditUnitPaymentReceiptScreen;
