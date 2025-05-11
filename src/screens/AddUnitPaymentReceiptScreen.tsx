import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, Menu } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { UnitPaymentReceipt } from '../database/unitPaymentReceiptsDb';
import { addUnitPaymentReceipt, getUnitPaymentReceipts } from '../database/unitPaymentReceiptsDb';
import { spacing } from '../constants/theme';
import { formatDate } from '../utils/formatters';

type AddUnitPaymentReceiptScreenRouteProp = RouteProp<RootStackParamList, 'AddUnitPaymentReceipt'>;
type AddUnitPaymentReceiptNavigationProp = StackNavigationProp<RootStackParamList>;

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

const AddUnitPaymentReceiptScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddUnitPaymentReceiptNavigationProp>();
  const route = useRoute<AddUnitPaymentReceiptScreenRouteProp>();
  const { unitId } = route.params;

  // Form state
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextSrNo, setNextSrNo] = useState(1);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modeMenuVisible, setModeMenuVisible] = useState(false);

  // Load existing payment receipts to determine next sr_no
  useEffect(() => {
    const loadData = async () => {
      try {
        const receipts = await getUnitPaymentReceipts(unitId);
        if (receipts.length > 0) {
          const maxSrNo = Math.max(...receipts.map(r => r.sr_no));
          setNextSrNo(maxSrNo + 1);
        }
      } catch (error) {
        console.error('Error loading payment receipts:', error);
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

      const newReceipt: UnitPaymentReceipt = {
        unit_id: unitId,
        sr_no: nextSrNo,
        date: date.getTime(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        mode: mode.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };

      await addUnitPaymentReceipt(newReceipt);

      Alert.alert('Success', 'Payment receipt added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding payment receipt:', error);
      Alert.alert('Error', 'Failed to add payment receipt. Please try again.');
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
            Add Payment Receipt
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

export default AddUnitPaymentReceiptScreen;
