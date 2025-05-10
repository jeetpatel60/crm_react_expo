import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Menu, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Lead, LeadStatus } from '../database/leadsDb';
import { addLead } from '../database';
import { convertLeadToClient } from '../utils/conversionUtils';
import { spacing } from '../constants/theme';

type AddLeadNavigationProp = StackNavigationProp<RootStackParamList>;

// Define dropdown options
const ENQUIRY_OPTIONS = [
  'Residential Apartment',
  'Commercial Space',
  'Office Space',
  'Land/Plot',
  'Villa/Independent House',
  'Other'
];

const LEAD_STATUS_OPTIONS = [
  { label: 'Lead', value: 'Lead' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Quote Given', value: 'Quote Given' },
  { label: 'Converted', value: 'Converted' },
];

// Lead Status options defined in constants

const AddLeadScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddLeadNavigationProp>();

  // Form state
  const [name, setName] = useState('');
  const [enquiryFor, setEnquiryFor] = useState('');
  const [budget, setBudget] = useState('');
  const [reference, setReference] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [status, setStatus] = useState<LeadStatus>('Lead');

  // Dropdown menus state
  const [enquiryMenuVisible, setEnquiryMenuVisible] = useState(false);

  // Validation state
  const [nameError, setNameError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate name (required)
    if (!name.trim()) {
      setNameError('Lead name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  };

  // Function to handle status change to Converted
  const handleStatusChange = (newStatus: LeadStatus) => {
    setStatus(newStatus);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const newLead: Lead = {
        name: name.trim(),
        enquiry_for: enquiryFor,
        budget: budget ? parseFloat(budget) : undefined,
        reference,
        lead_source: leadSource,
        status,
      };

      // Add the lead to the database
      const leadId = await addLead(newLead);

      // If the lead status is Converted, ask if they want to create a client
      if (status === 'Converted') {
        Alert.alert(
          'Convert to Client',
          'Would you like to convert this lead into a client?',
          [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => {
                // If user cancels, revert to 'Lead' status
                setStatus('Lead');
              }
            },
            {
              text: 'Yes',
              onPress: async () => {
                try {
                  // Make sure the lead has status set to Converted
                  // This is already done when creating the lead, but we'll ensure it here as well
                  const leadWithConvertedStatus: Lead = {
                    ...newLead,
                    status: 'Converted'
                  };

                  // Convert lead to client
                  const clientId = await convertLeadToClient(leadWithConvertedStatus);

                  Alert.alert(
                    'Success',
                    'Lead has been converted to a client successfully. You can find the new client in the Clients section.'
                  );
                } catch (error) {
                  console.error('Error during conversion:', error);
                  Alert.alert('Error', 'Failed to convert lead to client');
                }
              },
            },
          ]
        );
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error adding lead:', error);
      Alert.alert('Error', 'Failed to add lead');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Lead Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!nameError}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {nameError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {nameError}
          </Text>
        ) : null}

        <View style={styles.dropdownContainer}>
          <TextInput
            label="Enquiry For"
            value={enquiryFor}
            onChangeText={setEnquiryFor}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setEnquiryMenuVisible(true)}
              />
            }
          />
          <Menu
            visible={enquiryMenuVisible}
            onDismiss={() => setEnquiryMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={[styles.menu, { marginTop: 60 }]}
          >
            {ENQUIRY_OPTIONS.map((option) => (
              <Menu.Item
                key={option}
                onPress={() => {
                  setEnquiryFor(option);
                  setEnquiryMenuVisible(false);
                }}
                title={option}
              />
            ))}
          </Menu>
        </View>

        <TextInput
          label="Budget"
          value={budget}
          onChangeText={(text) => {
            // Allow only numbers and decimal point
            const filtered = text.replace(/[^0-9.]/g, '');
            setBudget(filtered);
          }}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.input}
          placeholder="0.00"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Reference"
          value={reference}
          onChangeText={setReference}
          mode="outlined"
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Lead Source"
          value={leadSource}
          onChangeText={setLeadSource}
          mode="outlined"
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Status</Text>
        <SegmentedButtons
          value={status}
          onValueChange={(value) => handleStatusChange(value as LeadStatus)}
          buttons={LEAD_STATUS_OPTIONS}
          style={styles.segmentedButtons}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          loading={false}
        >
          Add Lead
        </Button>
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  menu: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  segmentedButtons: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  errorText: {
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
});

export default AddLeadScreen;
