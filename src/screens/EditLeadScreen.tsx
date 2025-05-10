import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Menu, Divider } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Lead, LeadStatus } from '../database/leadsDb';
import { updateLead } from '../database';
import { spacing } from '../constants/theme';

type EditLeadScreenRouteProp = RouteProp<RootStackParamList, 'EditLead'>;
type EditLeadScreenNavigationProp = StackNavigationProp<RootStackParamList>;

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

const EditLeadScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditLeadScreenNavigationProp>();
  const route = useRoute<EditLeadScreenRouteProp>();
  const { lead } = route.params;

  // Form state
  const [name, setName] = useState(lead.name);
  const [enquiryFor, setEnquiryFor] = useState(lead.enquiry_for || '');
  const [budget, setBudget] = useState(lead.budget ? lead.budget.toString() : '');
  const [reference, setReference] = useState(lead.reference || '');
  const [leadSource, setLeadSource] = useState(lead.lead_source || '');
  const [status, setStatus] = useState<LeadStatus>(lead.status);

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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updatedLead: Lead = {
        ...lead,
        name: name.trim(),
        enquiry_for: enquiryFor,
        budget: budget ? parseFloat(budget) : undefined,
        reference,
        lead_source: leadSource,
        status,
      };

      await updateLead(updatedLead);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating lead:', error);
      Alert.alert('Error', 'Failed to update lead');
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
          onValueChange={(value) => setStatus(value as LeadStatus)}
          buttons={LEAD_STATUS_OPTIONS}
          style={styles.segmentedButtons}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          loading={false}
        >
          Update Lead
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

export default EditLeadScreen;
