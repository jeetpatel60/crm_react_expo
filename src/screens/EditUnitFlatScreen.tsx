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
import { spacing, shadows, borderRadius } from '../constants/theme';
import { UNIT_STATUS_OPTIONS } from '../constants';

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
  const [areaSqft, setAreaSqft] = useState(unit.area_sqft?.toString() || '');
  const [ratePerSqft, setRatePerSqft] = useState(unit.rate_per_sqft?.toString() || '');
  const [receivedAmount, setReceivedAmount] = useState(unit.received_amount?.toString() || '0');
  const [status, setStatus] = useState<UnitStatus>(unit.status);
  const [type, setType] = useState(unit.type || '');

  // UI state
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!flatNo.trim()) {
      newErrors.flatNo = 'Flat No is required';
    }

    if (!projectId) {
      newErrors.project = 'Project is required';
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
        area_sqft: areaSqft ? parseFloat(areaSqft) : undefined,
        rate_per_sqft: ratePerSqft ? parseFloat(ratePerSqft) : undefined,
        flat_value: parseFloat(flatValue),
        received_amount: receivedAmount ? parseFloat(receivedAmount) : 0,
        balance_amount: parseFloat(balanceAmount),
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
            />
            {errors.receivedAmount && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.receivedAmount}
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
                  setStatus(option.value as UnitStatus);
                  setStatusMenuVisible(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
        </View>

        <TextInput
          label="Type (e.g., 2 BHK)"
          value={type}
          onChangeText={setType}
          mode="outlined"
          style={styles.input}
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
