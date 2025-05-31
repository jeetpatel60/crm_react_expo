import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Menu, Divider, Portal, Modal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Lead, LeadStatus } from '../database/leadsDb';
import { addLead } from '../database';
import { Project, getProjects } from '../database/projectsDb';
import { UnitFlat, getUnitsFlatsByProjectId } from '../database/unitsFlatDb';
import { convertLeadToClient } from '../utils/conversionUtils';
import { spacing } from '../constants/theme';

type AddLeadNavigationProp = StackNavigationProp<RootStackParamList>;

const LEAD_STATUS_OPTIONS = [
  { label: 'Lead', value: 'Lead' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Quote Given', value: 'Quote Given' },
  { label: 'Converted', value: 'Converted' },
];

const AddLeadScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddLeadNavigationProp>();

  // Form state
  const [name, setName] = useState('');
  const [enquiryFor, setEnquiryFor] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedUnitFlatId, setSelectedUnitFlatId] = useState<number | null>(null);
  const [budget, setBudget] = useState('');
  const [reference, setReference] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [status, setStatus] = useState<LeadStatus>('Lead');

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [unitsFlats, setUnitsFlats] = useState<UnitFlat[]>([]);

  // Dropdown menus state
  const [enquiryMenuVisible, setEnquiryMenuVisible] = useState(false);
  const [unitsMenuVisible, setUnitsMenuVisible] = useState(false);

  // Validation state
  const [nameError, setNameError] = useState('');

  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        console.log('Loading projects...');
        const projectsData = await getProjects();
        console.log('Projects loaded:', projectsData.length, 'projects');
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
        Alert.alert('Error', 'Failed to load projects');
      }
    };

    loadProjects();
  }, []);

  // Load units when project is selected
  useEffect(() => {
    const loadUnits = async () => {
      if (selectedProjectId) {
        try {
          const unitsData = await getUnitsFlatsByProjectId(selectedProjectId);
          // Filter to only show available units
          const availableUnits = unitsData.filter(unit => unit.status === 'Available');
          console.log('Available units for project:', availableUnits.length, 'out of', unitsData.length);
          setUnitsFlats(availableUnits);
        } catch (error) {
          console.error('Error loading units:', error);
          Alert.alert('Error', 'Failed to load units');
        }
      } else {
        setUnitsFlats([]);
        setSelectedUnitFlatId(null);
      }
    };

    loadUnits();
  }, [selectedProjectId]);

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
        unit_flat_id: selectedUnitFlatId || undefined,
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
            label="Enquiry For (Project)"
            value={enquiryFor}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            editable={false}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setEnquiryMenuVisible(true)}
              />
            }
            onPress={() => {
              console.log('Opening project modal, projects count:', projects.length);
              setEnquiryMenuVisible(true);
            }}
          />
          <Portal>
            <Modal
              visible={enquiryMenuVisible}
              onDismiss={() => setEnquiryMenuVisible(false)}
              contentContainerStyle={[
                styles.modalContainer,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Text style={styles.modalTitle}>Select Project</Text>
              <ScrollView style={styles.modalScrollView}>
                {projects.length === 0 ? (
                  <Text style={styles.emptyText}>No projects available</Text>
                ) : (
                  projects.map((project) => (
                    <Button
                      key={project.id}
                      mode="text"
                      onPress={() => {
                        setEnquiryFor(project.name);
                        setSelectedProjectId(project.id!);
                        setEnquiryMenuVisible(false);
                      }}
                      style={styles.modalButton}
                    >
                      {project.name}
                    </Button>
                  ))
                )}
              </ScrollView>
              <Button
                mode="contained"
                onPress={() => setEnquiryMenuVisible(false)}
                style={styles.modalCloseButton}
              >
                Close
              </Button>
            </Modal>
          </Portal>
        </View>

        {selectedProjectId && (
          <View style={styles.dropdownContainer}>
            <TextInput
              label="Flats / Units"
              value={selectedUnitFlatId ? unitsFlats.find(unit => unit.id === selectedUnitFlatId)?.flat_no || '' : ''}
              mode="outlined"
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              editable={false}
              right={
                <TextInput.Icon
                  icon="menu-down"
                  onPress={() => setUnitsMenuVisible(true)}
                />
              }
              onPress={() => setUnitsMenuVisible(true)}
            />
            <Portal>
              <Modal
                visible={unitsMenuVisible}
                onDismiss={() => setUnitsMenuVisible(false)}
                contentContainerStyle={[
                  styles.modalContainer,
                  { backgroundColor: theme.colors.surface }
                ]}
              >
                <Text style={styles.modalTitle}>Select Unit/Flat</Text>
                <ScrollView style={styles.modalScrollView}>
                  {unitsFlats.length === 0 ? (
                    <Text style={styles.emptyText}>No available units for this project</Text>
                  ) : (
                    unitsFlats.map((unit) => (
                      <Button
                        key={unit.id}
                        mode="text"
                        onPress={() => {
                          setSelectedUnitFlatId(unit.id!);
                          setUnitsMenuVisible(false);
                        }}
                        style={styles.modalButton}
                      >
                        {unit.flat_no}
                      </Button>
                    ))
                  )}
                </ScrollView>
                <Button
                  mode="contained"
                  onPress={() => setUnitsMenuVisible(false)}
                  style={styles.modalCloseButton}
                >
                  Close
                </Button>
              </Modal>
            </Portal>
          </View>
        )}

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
  menuContent: {
    backgroundColor: 'white',
    maxHeight: 200,
  },
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  modalButton: {
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  modalCloseButton: {
    marginTop: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.lg,
    color: '#666',
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
