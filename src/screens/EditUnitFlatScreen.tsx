import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, Menu, Portal, Modal } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { UnitFlat, UnitStatus } from '../database/unitsFlatDb';
import { Project } from '../database/projectsDb';
import { updateUnitFlat } from '../database/unitsFlatDb';
import { getProjects } from '../database/projectsDb';
import { getClientById } from '../database/clientsDb';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { UNIT_STATUS_OPTIONS, UNIT_TYPE_OPTIONS } from '../constants';
import { ClientSelectionModal } from '../components';

type EditUnitFlatScreenRouteProp = RouteProp<RootStackParamList, 'EditUnitFlat'>;
type EditUnitFlatNavigationProp = StackNavigationProp<RootStackParamList>;

const EditUnitFlatScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditUnitFlatNavigationProp>();
  const route = useRoute<EditUnitFlatScreenRouteProp>();
  const { unit } = route.params;

  // Form state
  const [flatNo, setFlatNo] = useState(unit.flat_no);
  const [projectId, setProjectId] = useState<number>(unit.project_id);
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState<number | null>(unit.client_id || null);
  const [clientName, setClientName] = useState('');
  const [areaSqft, setAreaSqft] = useState(unit.area_sqft?.toString() || '');
  const [ratePerSqft, setRatePerSqft] = useState(unit.rate_per_sqft?.toString() || '');
  const [receivedAmount, setReceivedAmount] = useState(unit.received_amount?.toString() || '0');
  const [bValue, setBValue] = useState(unit.b_value?.toString() || '0');
  const [wValue, setWValue] = useState(unit.w_value?.toString() || '0');
  const [gstPercentage, setGstPercentage] = useState(unit.gst_percentage?.toString() || '0');
  const [gstAmount, setGstAmount] = useState(unit.gst_amount?.toString() || '0');
  const [status, setStatus] = useState<UnitStatus>(unit.status);
  const [type, setType] = useState(unit.type || '');

  // UI state
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [clientSelectionVisible, setClientSelectionVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Calculated fields
  const flatValue = areaSqft && ratePerSqft
    ? (parseFloat(areaSqft) * parseFloat(ratePerSqft)).toFixed(2)
    : '0.00';

  const balanceAmount = flatValue && receivedAmount
    ? (parseFloat(flatValue) - parseFloat(receivedAmount)).toFixed(2)
    : '0.00';

  // Load projects and set initial project name
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);

        // Find the project name for the current unit
        const currentProject = projectsData.find(p => p.id === unit.project_id);
        if (currentProject) {
          setProjectName(currentProject.name);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        Alert.alert('Error', 'Failed to load projects');
      }
    };

    loadProjects();
  }, [unit.project_id]);

  // Load client name if client_id exists
  useEffect(() => {
    const loadClientName = async () => {
      if (unit.client_id) {
        try {
          const client = await getClientById(unit.client_id);
          if (client) {
            setClientName(client.name);
          }
        } catch (error) {
          console.error('Error loading client:', error);
        }
      }
    };

    loadClientName();
  }, [unit.client_id]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!flatNo.trim()) {
      newErrors.flatNo = 'Flat No is required';
    }

    if (!projectId) {
      newErrors.project = 'Project is required';
    }

    if (status === 'Sold' && !clientId) {
      newErrors.client = 'Client is required when status is Sold';
    }

    if (areaSqft && isNaN(parseFloat(areaSqft))) {
      newErrors.areaSqft = 'Area must be a valid number';
    }

    if (ratePerSqft && isNaN(parseFloat(ratePerSqft))) {
      newErrors.ratePerSqft = 'Rate must be a valid number';
    }

    if (receivedAmount && isNaN(parseFloat(receivedAmount))) {
      newErrors.receivedAmount = 'Received amount must be a valid number';
    }

    if (bValue && isNaN(parseFloat(bValue))) {
      newErrors.bValue = 'B Value must be a valid number';
    }

    if (wValue && isNaN(parseFloat(wValue))) {
      newErrors.wValue = 'W Value must be a valid number';
    }

    if (gstPercentage && isNaN(parseFloat(gstPercentage))) {
      newErrors.gstPercentage = 'GST % must be a valid number';
    }

    if (gstPercentage && parseFloat(gstPercentage) < 0) {
      newErrors.gstPercentage = 'GST % cannot be negative';
    }

    if (gstPercentage && parseFloat(gstPercentage) > 100) {
      newErrors.gstPercentage = 'GST % cannot be more than 100';
    }

    if (gstAmount && isNaN(parseFloat(gstAmount))) {
      newErrors.gstAmount = 'GST Amount must be a valid number';
    }

    if (gstAmount && parseFloat(gstAmount) < 0) {
      newErrors.gstAmount = 'GST Amount cannot be negative';
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

      const updatedUnit: UnitFlat = {
        ...unit,
        flat_no: flatNo.trim(),
        project_id: projectId,
        client_id: clientId || undefined,
        area_sqft: areaSqft ? parseFloat(areaSqft) : undefined,
        rate_per_sqft: ratePerSqft ? parseFloat(ratePerSqft) : undefined,
        flat_value: parseFloat(flatValue),
        received_amount: receivedAmount ? parseFloat(receivedAmount) : 0,
        balance_amount: parseFloat(balanceAmount),
        b_value: bValue ? parseFloat(bValue) : 0,
        w_value: wValue ? parseFloat(wValue) : 0,
        gst_percentage: gstPercentage ? parseFloat(gstPercentage) : 0,
        gst_amount: gstAmount ? parseFloat(gstAmount) : 0,
        status,
        type: type.trim() || undefined,
      };

      const projectChanged = unit.project_id !== projectId;
      await updateUnitFlat(updatedUnit);

      if (projectChanged) {
        Alert.alert(
          'Success',
          'Unit/Flat updated successfully. If no customer schedules existed, they have been auto-populated from the new project milestones.'
        );
      } else {
        Alert.alert('Success', 'Unit/Flat updated successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error updating unit/flat:', error);
      Alert.alert('Error', 'Failed to update unit/flat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Flat No *"
          value={flatNo}
          onChangeText={setFlatNo}
          mode="outlined"
          style={styles.input}
          error={!!errors.flatNo}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.flatNo && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.flatNo}
          </Text>
        )}

        <Text style={styles.sectionTitle}>Project *</Text>
        <View style={styles.dropdownContainer}>
          <TextInput
            label="Select Project"
            value={projectName}
            mode="outlined"
            style={styles.input}
            error={!!errors.project}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setProjectMenuVisible(true)}
              />
            }
            onTouchStart={() => setProjectMenuVisible(true)}
          />
          {errors.project && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.project}
            </Text>
          )}
          <Portal>
            <Modal
              visible={projectMenuVisible}
              onDismiss={() => setProjectMenuVisible(false)}
              contentContainerStyle={[
                styles.modalContainer,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Text style={styles.modalTitle}>Select Project</Text>
              <ScrollView style={styles.modalScrollView}>
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    mode="text"
                    onPress={() => {
                      setProjectId(project.id!);
                      setProjectName(project.name);
                      setProjectMenuVisible(false);
                    }}
                    style={styles.modalButton}
                  >
                    {project.name}
                  </Button>
                ))}
              </ScrollView>
              <Button
                mode="contained"
                onPress={() => setProjectMenuVisible(false)}
                style={styles.modalCloseButton}
              >
                Close
              </Button>
            </Modal>
          </Portal>
        </View>

        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.dropdownContainer}>
          <TextInput
            label="Select Client"
            value={clientName}
            mode="outlined"
            style={styles.input}
            error={!!errors.client}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setClientSelectionVisible(true)}
              />
            }
            onTouchStart={() => setClientSelectionVisible(true)}
            disabled={status !== 'Sold'}
          />
          {errors.client && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.client}
            </Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              label="Area (sqft)"
              value={areaSqft}
              onChangeText={setAreaSqft}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.areaSqft}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />
            {errors.areaSqft && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.areaSqft}
              </Text>
            )}
          </View>
          <View style={styles.halfInput}>
            <TextInput
              label="Rate/sqft"
              value={ratePerSqft}
              onChangeText={setRatePerSqft}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.ratePerSqft}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              disabled={status !== 'Sold'}
            />
            {errors.ratePerSqft && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.ratePerSqft}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              label="Flat Value"
              value={`₹ ${flatValue}`}
              mode="outlined"
              style={styles.input}
              disabled
              outlineColor={theme.colors.outline}
            />
          </View>
          <View style={styles.halfInput}>
            <TextInput
              label="Received Amount"
              value={receivedAmount}
              onChangeText={setReceivedAmount}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.receivedAmount}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              disabled={status !== 'Sold'}
            />
            {errors.receivedAmount && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.receivedAmount}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              label="B Value"
              value={bValue}
              onChangeText={setBValue}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.bValue}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              disabled={status !== 'Sold'}
            />
            {errors.bValue && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.bValue}
              </Text>
            )}
          </View>
          <View style={styles.halfInput}>
            <TextInput
              label="W Value"
              value={wValue}
              onChangeText={setWValue}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.wValue}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              disabled={status !== 'Sold'}
            />
            {errors.wValue && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.wValue}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              label="GST %"
              value={gstPercentage}
              onChangeText={setGstPercentage}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.gstPercentage}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />
            {errors.gstPercentage && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.gstPercentage}
              </Text>
            )}
          </View>
          <View style={styles.halfInput}>
            <TextInput
              label="GST Amount"
              value={gstAmount}
              onChangeText={setGstAmount}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.gstAmount}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />
            {errors.gstAmount && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.gstAmount}
              </Text>
            )}
          </View>
        </View>

        <TextInput
          label="Balance Amount"
          value={`₹ ${balanceAmount}`}
          mode="outlined"
          style={styles.input}
          disabled
          outlineColor={theme.colors.outline}
        />

        <View style={styles.dropdownContainer}>
          <TextInput
            label="Status"
            value={status}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setStatusMenuVisible(true)}
              />
            }
            onTouchStart={() => setStatusMenuVisible(true)}
          />
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={[styles.menu, { marginTop: 60 }]}
          >
            {UNIT_STATUS_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  const newStatus = option.value as UnitStatus;
                  setStatus(newStatus);
                  setStatusMenuVisible(false);

                  // If status is changed to "Sold", show client selection modal
                  if (newStatus === 'Sold' && !clientId) {
                    setClientSelectionVisible(true);
                  }

                  // If status is changed from "Sold" to something else, clear client
                  if (newStatus !== 'Sold' && clientId) {
                    setClientId(null);
                    setClientName('');
                  }
                }}
                title={option.label}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.dropdownContainer}>
          <TextInput
            label="Type"
            value={type}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setTypeMenuVisible(true)}
              />
            }
            onTouchStart={() => setTypeMenuVisible(true)}
          />
          <Menu
            visible={typeMenuVisible}
            onDismiss={() => setTypeMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={[styles.menu, { marginTop: 60 }]}
          >
            {UNIT_TYPE_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setType(option.value);
                  setTypeMenuVisible(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Update Unit/Flat
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

      {/* Client Selection Modal */}
      <ClientSelectionModal
        visible={clientSelectionVisible}
        onDismiss={() => setClientSelectionVisible(false)}
        onSelect={(id, name) => {
          setClientId(id);
          setClientName(name);
          setClientSelectionVisible(false);
        }}
        title="Select Client for Unit/Flat"
      />
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
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  dropdownContainer: {
    marginBottom: spacing.sm,
    position: 'relative',
  },
  menu: {
    width: '90%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
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
  modalContainer: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalButton: {
    marginVertical: 2,
    justifyContent: 'flex-start',
  },
  modalCloseButton: {
    marginTop: spacing.md,
  },
});

export default EditUnitFlatScreen;
