import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, RadioButton } from 'react-native-paper';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { RecordType } from '../utils/reportUtils';

interface RecordTypeSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (recordType: RecordType) => void;
  selectedRecordType: RecordType;
}

const RecordTypeSelectionModal: React.FC<RecordTypeSelectionModalProps> = ({
  visible,
  onDismiss,
  onSelect,
  selectedRecordType,
}) => {
  const theme = useTheme();

  const recordTypeOptions = [
    {
      value: 'all' as RecordType,
      label: 'All Records',
      description: 'Show all payment requests and receipts with flat value',
    },
    {
      value: 'white' as RecordType,
      label: 'Only White',
      description: 'Show W Value and receipts with Cheque, Bank Transfer, UPI, Credit Card, Debit Card',
    },
    {
      value: 'black' as RecordType,
      label: 'Only Black',
      description: 'Show B Value and receipts with Cash & Others',
    },
  ];

  const handleSelect = (recordType: RecordType) => {
    onSelect(recordType);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
          Select Record Type
        </Text>
        
        <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Choose which records to display in the customer ledger report:
        </Text>

        <View style={styles.optionsContainer}>
          {recordTypeOptions.map((option) => (
            <View key={option.value} style={styles.optionItem}>
              <RadioButton.Item
                label={option.label}
                value={option.value}
                status={selectedRecordType === option.value ? 'checked' : 'unchecked'}
                onPress={() => handleSelect(option.value)}
                labelStyle={[styles.optionLabel, { color: theme.colors.onSurface }]}
                style={styles.radioItem}
              />
              <Text style={[styles.optionDescription, { color: theme.colors.onSurfaceVariant }]}>
                {option.description}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={[styles.button, { borderColor: theme.colors.outline }]}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={() => handleSelect(selectedRecordType)}
            style={styles.button}
          >
            Apply
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.medium,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: spacing.lg,
  },
  optionItem: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  radioItem: {
    paddingVertical: spacing.xs,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 13,
    marginLeft: spacing.xl,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
});

export default RecordTypeSelectionModal;
