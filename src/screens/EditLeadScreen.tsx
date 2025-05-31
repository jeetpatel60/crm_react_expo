import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Menu, Divider, Portal, Modal } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Lead, LeadStatus } from '../database/leadsDb';
import { updateLead } from '../database';
import { Project, getProjects } from '../database/projectsDb';
import { UnitFlat, getUnitsFlatsByProjectId, getUnitFlatById } from '../database/unitsFlatDb';
import { convertLeadToClient } from '../utils/conversionUtils';
import { spacing } from '../constants/theme';

type EditLeadScreenRouteProp = RouteProp<RootStackParamList, 'EditLead'>;
type EditLeadScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const LEAD_STATUS_OPTIONS = [
  { label: 'Lead', value: 'Lead' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Quote Given', value: 'Quote Given' },
  { label: 'Converted', value: 'Converted' },
];

const EditLeadScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditLeadScreenNavigationProp>();
  const route = useRoute<EditLeadScreenRouteProp>();
  const { lead } = route.params;

  // Form state
  const [name, setName] = useState(lead.name);
  const [enquiryFor, setEnquiryFor] = useState(lead.enquiry_for || '');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(lead.unit_flat_id ? null : null);
  const [selectedUnitFlatId, setSelectedUnitFlatId] = useState<number | null>(lead.unit_flat_id || null);
  const [budget, setBudget] = useState(lead.budget ? lead.budget.toString() : '');
  const [reference, setReference] = useState(lead.reference || '');
  const [leadSource, setLeadSource] = useState(lead.lead_source || '');
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [previousStatus, setPreviousStatus] = useState<LeadStatus>(lead.status);

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [unitsFlats, setUnitsFlats] = useState<UnitFlat[]>([]);

  // Dropdown menus state
  const [enquiryMenuVisible, setEnquiryMenuVisible] = useState(false);
  const [unitsMenuVisible, setUnitsMenuVisible] = useState(false);

  // Validation state
  const [nameError, setNameError] = useState('');

  // Load projects on component mount and initialize selected project
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);

        // If lead has a unit_flat_id, find the corresponding project
        if (lead.unit_flat_id) {
          const unit = await getUnitFlatById(lead.unit_flat_id);
          if (unit) {
            setSelectedProjectId(unit.project_id);
            // The enquiry_for should be set to the project name
            const project = projectsData.find(p => p.id === unit.project_id);
            if (project) {
              setEnquiryFor(project.name);
            }
          }
        } else if (lead.enquiry_for) {
          // Try to find project by name
          const project = projectsData.find(p => p.name === lead.enquiry_for);
          if (project) {
            setSelectedProjectId(project.id!);
          }
        }
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
          // Filter to only show available units, but include the currently selected unit even if not available
          let availableUnits = unitsData.filter(unit => unit.status === 'Available');

          // If editing and there's a selected unit that's not available, include it in the list
          if (selectedUnitFlatId) {
            const selectedUnit = unitsData.find(unit => unit.id === selectedUnitFlatId);
            if (selectedUnit && selectedUnit.status !== 'Available') {
              availableUnits = [selectedUnit, ...availableUnits];
            }
          }

          console.log('Available units for project:', availableUnits.length, 'out of', unitsData.length);
          setUnitsFlats(availableUnits);
        } catch (error) {
          console.error('Error loading units:', error);
          Alert.alert('Error', 'Failed to load units');
        }
      } else {
        setUnitsFlats([]);
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
    // Update the status
    setStatus(newStatus);

    // If changing to Converted, show confirmation dialog
    if (newStatus === 'Converted' && previousStatus !== 'Converted') {
      // Update previous status to prevent multiple dialogs
      setPreviousStatus('Converted');

      Alert.alert(
        'Convert to Client',
        'Would you like to convert this lead into a client?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => {
              // Revert back to the previous status if user cancels
              setStatus(previousStatus);
            }
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                // Make sure the lead status is set to Converted
                const updatedLead: Lead = {
                  ...lead,
                  status: 'Converted'
                };

                // Update the lead status in the database
                await updateLead(updatedLead);

                // Update the UI to reflect the status change
                setStatus('Converted');

                // Convert lead to client
                const clientId = await convertLeadToClient(updatedLead);

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
        unit_flat_id: selectedUnitFlatId || undefined,
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
            onPress={() => setEnquiryMenuVisible(true)}
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
                        setSelectedUnitFlatId(null); // Reset unit selection when project changes
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
                        {unit.status === 'Available' ? unit.flat_no : `${unit.flat_no} (${unit.status})`}
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

export default EditLeadScreen;
