import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, Modal, Portal, DataTable, IconButton } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList, Quotation, QuotationAnnexureItem } from '../types';
import {
  updateQuotation,
  getProjects,
  getLeads,
  getUnitsFlats,
  getCompanies,
  getQuotationAnnexureA,
  getQuotationAnnexureB,
  getQuotationAnnexureC,
  addQuotationAnnexureA,
  addQuotationAnnexureB,
  addQuotationAnnexureC,
  updateQuotationAnnexureA,
  updateQuotationAnnexureB,
  updateQuotationAnnexureC,
  deleteQuotationAnnexureA,
  deleteQuotationAnnexureB,
  deleteQuotationAnnexureC
} from '../database';
import { getProjectById } from '../database/projectsDb';
import { getLeadById } from '../database/leadsDb';
import { getUnitFlatById } from '../database/unitsFlatDb';
import { getCompanyById } from '../database/companiesDb';
import { LoadingIndicator } from '../components';
import { spacing } from '../constants/theme';
import { formatDate, formatCurrency } from '../utils/formatters';

type EditQuotationRouteProp = RouteProp<RootStackParamList, 'EditQuotation'>;
type EditQuotationNavigationProp = StackNavigationProp<RootStackParamList>;

const EditQuotationScreen = () => {
  const theme = useTheme();
  const route = useRoute<EditQuotationRouteProp>();
  const navigation = useNavigation<EditQuotationNavigationProp>();
  const { quotation: initialQuotation } = route.params;

  // Form state
  const [quotationNo, setQuotationNo] = useState(initialQuotation.quotation_no);
  const [date, setDate] = useState<Date>(new Date(initialQuotation.date));
  const [projectId, setProjectId] = useState<number | null>(initialQuotation.project_id || null);
  const [projectName, setProjectName] = useState('');
  const [leadId, setLeadId] = useState<number | null>(initialQuotation.lead_id || null);
  const [leadName, setLeadName] = useState('');
  const [flatId, setFlatId] = useState<number | null>(initialQuotation.flat_id || null);
  const [flatNo, setFlatNo] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(initialQuotation.company_id || null);
  const [companyName, setCompanyName] = useState('');

  // Annexure items
  const [annexureA, setAnnexureA] = useState<QuotationAnnexureItem[]>([]);
  const [annexureB, setAnnexureB] = useState<QuotationAnnexureItem[]>([]);
  const [annexureC, setAnnexureC] = useState<QuotationAnnexureItem[]>([]);

  // New item form state
  const [newItemType, setNewItemType] = useState<'A' | 'B' | 'C' | null>(null);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  // Edit item form state
  const [editItemType, setEditItemType] = useState<'A' | 'B' | 'C' | null>(null);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('');

  // Dropdown menus
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [leadMenuVisible, setLeadMenuVisible] = useState(false);
  const [flatMenuVisible, setFlatMenuVisible] = useState(false);
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [editItemModalVisible, setEditItemModalVisible] = useState(false);

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data lists
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Form validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Calculate total amount
  const totalAmount = [
    ...annexureA.map(item => item.amount),
    ...annexureB.map(item => item.amount),
    ...annexureC.map(item => item.amount)
  ].reduce((sum, amount) => sum + amount, 0);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        // Load annexure items
        const annexureAData = await getQuotationAnnexureA(initialQuotation.id!);
        setAnnexureA(annexureAData);

        const annexureBData = await getQuotationAnnexureB(initialQuotation.id!);
        setAnnexureB(annexureBData);

        const annexureCData = await getQuotationAnnexureC(initialQuotation.id!);
        setAnnexureC(annexureCData);

        // Load projects, leads, flats, and companies
        const projectsData = await getProjects();
        setProjects(projectsData);

        const leadsData = await getLeads();
        setLeads(leadsData);

        const flatsData = await getUnitsFlats();
        setFlats(flatsData);

        const companiesData = await getCompanies();
        setCompanies(companiesData);

        // Set names for selected entities
        if (projectId) {
          const project = await getProjectById(projectId);
          if (project) {
            setProjectName(project.name);
          }
        }

        if (leadId) {
          const lead = await getLeadById(leadId);
          if (lead) {
            setLeadName(lead.name);
          }
        }

        if (flatId) {
          const flat = await getUnitFlatById(flatId);
          if (flat) {
            setFlatNo(flat.flat_no);
          }
        }

        if (companyId) {
          const company = await getCompanyById(companyId);
          if (company) {
            setCompanyName(company.name);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        Alert.alert('Error', 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [initialQuotation.id, projectId, leadId, flatId, companyId]);

  // Date picker handlers
  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Add new annexure item
  const addAnnexureItem = () => {
    if (!newItemType) {
      Alert.alert('Error', 'Please select an annexure type');
      return;
    }

    if (!newItemDescription.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    const amount = parseFloat(newItemAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newItem: QuotationAnnexureItem = {
      quotation_id: initialQuotation.id!,
      sr_no: 0, // Will be set based on array length
      description: newItemDescription.trim(),
      amount: amount
    };

    if (newItemType === 'A') {
      newItem.sr_no = annexureA.length + 1;
      setAnnexureA([...annexureA, newItem]);
    } else if (newItemType === 'B') {
      newItem.sr_no = annexureB.length + 1;
      setAnnexureB([...annexureB, newItem]);
    } else if (newItemType === 'C') {
      newItem.sr_no = annexureC.length + 1;
      setAnnexureC([...annexureC, newItem]);
    }

    // Reset form
    setNewItemDescription('');
    setNewItemAmount('');
    setAddItemModalVisible(false);
  };

  // Edit annexure item
  const openEditItemModal = (type: 'A' | 'B' | 'C', item: QuotationAnnexureItem) => {
    setEditItemType(type);
    setEditItemId(item.id!);
    setEditItemDescription(item.description);
    setEditItemAmount(item.amount.toString());
    setEditItemModalVisible(true);
  };

  const updateAnnexureItem = () => {
    if (!editItemType || !editItemId) {
      return;
    }

    if (!editItemDescription.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    const amount = parseFloat(editItemAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const updatedItem: QuotationAnnexureItem = {
      id: editItemId,
      quotation_id: initialQuotation.id!,
      sr_no: 0, // Will be updated below
      description: editItemDescription.trim(),
      amount: amount
    };

    if (editItemType === 'A') {
      const index = annexureA.findIndex(item => item.id === editItemId);
      if (index !== -1) {
        updatedItem.sr_no = annexureA[index].sr_no;
        const updatedItems = [...annexureA];
        updatedItems[index] = updatedItem;
        setAnnexureA(updatedItems);
      }
    } else if (editItemType === 'B') {
      const index = annexureB.findIndex(item => item.id === editItemId);
      if (index !== -1) {
        updatedItem.sr_no = annexureB[index].sr_no;
        const updatedItems = [...annexureB];
        updatedItems[index] = updatedItem;
        setAnnexureB(updatedItems);
      }
    } else if (editItemType === 'C') {
      const index = annexureC.findIndex(item => item.id === editItemId);
      if (index !== -1) {
        updatedItem.sr_no = annexureC[index].sr_no;
        const updatedItems = [...annexureC];
        updatedItems[index] = updatedItem;
        setAnnexureC(updatedItems);
      }
    }

    // Reset form
    setEditItemType(null);
    setEditItemId(null);
    setEditItemDescription('');
    setEditItemAmount('');
    setEditItemModalVisible(false);
  };

  // Remove annexure item
  const removeAnnexureItem = (type: 'A' | 'B' | 'C', index: number) => {
    if (type === 'A') {
      const updatedItems = [...annexureA];
      updatedItems.splice(index, 1);
      // Update sr_no for remaining items
      const reorderedItems = updatedItems.map((item, idx) => ({
        ...item,
        sr_no: idx + 1
      }));
      setAnnexureA(reorderedItems);
    } else if (type === 'B') {
      const updatedItems = [...annexureB];
      updatedItems.splice(index, 1);
      const reorderedItems = updatedItems.map((item, idx) => ({
        ...item,
        sr_no: idx + 1
      }));
      setAnnexureB(reorderedItems);
    } else if (type === 'C') {
      const updatedItems = [...annexureC];
      updatedItems.splice(index, 1);
      const reorderedItems = updatedItems.map((item, idx) => ({
        ...item,
        sr_no: idx + 1
      }));
      setAnnexureC(reorderedItems);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!quotationNo.trim()) {
      newErrors.quotationNo = 'Quotation number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save quotation
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Create quotation object
      const quotation: Quotation = {
        id: initialQuotation.id,
        quotation_no: quotationNo,
        date: date.getTime(),
        project_id: projectId || undefined,
        lead_id: leadId || undefined,
        flat_id: flatId || undefined,
        company_id: companyId || undefined,
        total_amount: totalAmount
      };

      // Update quotation in database
      await updateQuotation(quotation);

      // Handle annexure A items
      const existingAnnexureA = await getQuotationAnnexureA(initialQuotation.id!);

      // Delete removed items
      for (const existingItem of existingAnnexureA) {
        if (!annexureA.some(item => item.id === existingItem.id)) {
          await deleteQuotationAnnexureA(existingItem.id!, initialQuotation.id!);
        }
      }

      // Add or update items
      for (const item of annexureA) {
        if (item.id) {
          // Update existing item
          await updateQuotationAnnexureA(item);
        } else {
          // Add new item
          await addQuotationAnnexureA({
            ...item,
            quotation_id: initialQuotation.id!
          });
        }
      }

      // Handle annexure B items
      const existingAnnexureB = await getQuotationAnnexureB(initialQuotation.id!);

      // Delete removed items
      for (const existingItem of existingAnnexureB) {
        if (!annexureB.some(item => item.id === existingItem.id)) {
          await deleteQuotationAnnexureB(existingItem.id!, initialQuotation.id!);
        }
      }

      // Add or update items
      for (const item of annexureB) {
        if (item.id) {
          // Update existing item
          await updateQuotationAnnexureB(item);
        } else {
          // Add new item
          await addQuotationAnnexureB({
            ...item,
            quotation_id: initialQuotation.id!
          });
        }
      }

      // Handle annexure C items
      const existingAnnexureC = await getQuotationAnnexureC(initialQuotation.id!);

      // Delete removed items
      for (const existingItem of existingAnnexureC) {
        if (!annexureC.some(item => item.id === existingItem.id)) {
          await deleteQuotationAnnexureC(existingItem.id!, initialQuotation.id!);
        }
      }

      // Add or update items
      for (const item of annexureC) {
        if (item.id) {
          // Update existing item
          await updateQuotationAnnexureC(item);
        } else {
          // Add new item
          await addQuotationAnnexureC({
            ...item,
            quotation_id: initialQuotation.id!
          });
        }
      }

      Alert.alert('Success', 'Quotation updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating quotation:', error);
      Alert.alert('Error', 'Failed to update quotation');
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Edit Quotation</Text>

      {/* Quotation No */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Quotation No *</Text>
      <TextInput
        label="Quotation No"
        value={quotationNo}
        onChangeText={setQuotationNo}
        mode="outlined"
        style={styles.input}
        error={!!errors.quotationNo}
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
      />
      {errors.quotationNo && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {errors.quotationNo}
        </Text>
      )}

      {/* Date */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Date *</Text>
      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
        icon="calendar"
      >
        {formatDate(date.getTime())}
      </Button>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Project */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Project</Text>
      <View style={styles.dropdownContainer}>
        <TextInput
          label="Select Project"
          value={projectName}
          mode="outlined"
          style={styles.input}
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
        <Portal>
          <Modal
            visible={projectMenuVisible}
            onDismiss={() => setProjectMenuVisible(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Select Project</Text>
            <ScrollView style={styles.modalScrollView}>
              {projects.map((project) => (
                <Button
                  key={project.id}
                  mode="text"
                  onPress={() => {
                    setProjectId(project.id);
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
              mode="text"
              onPress={() => {
                setProjectId(null);
                setProjectName('');
                setProjectMenuVisible(false);
              }}
              style={styles.clearButton}
            >
              Clear Selection
            </Button>
          </Modal>
        </Portal>
      </View>

      {/* Lead */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Lead</Text>
      <View style={styles.dropdownContainer}>
        <TextInput
          label="Select Lead"
          value={leadName}
          mode="outlined"
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          right={
            <TextInput.Icon
              icon="menu-down"
              onPress={() => setLeadMenuVisible(true)}
            />
          }
          onTouchStart={() => setLeadMenuVisible(true)}
        />
        <Portal>
          <Modal
            visible={leadMenuVisible}
            onDismiss={() => setLeadMenuVisible(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Select Lead</Text>
            <ScrollView style={styles.modalScrollView}>
              {leads.map((lead) => (
                <Button
                  key={lead.id}
                  mode="text"
                  onPress={() => {
                    setLeadId(lead.id);
                    setLeadName(lead.name);
                    setLeadMenuVisible(false);
                  }}
                  style={styles.modalButton}
                >
                  {lead.name}
                </Button>
              ))}
            </ScrollView>
            <Button
              mode="text"
              onPress={() => {
                setLeadId(null);
                setLeadName('');
                setLeadMenuVisible(false);
              }}
              style={styles.clearButton}
            >
              Clear Selection
            </Button>
          </Modal>
        </Portal>
      </View>

      {/* Flat */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Flat</Text>
      <View style={styles.dropdownContainer}>
        <TextInput
          label="Select Flat"
          value={flatNo}
          mode="outlined"
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          right={
            <TextInput.Icon
              icon="menu-down"
              onPress={() => setFlatMenuVisible(true)}
            />
          }
          onTouchStart={() => setFlatMenuVisible(true)}
        />
        <Portal>
          <Modal
            visible={flatMenuVisible}
            onDismiss={() => setFlatMenuVisible(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Select Flat</Text>
            <ScrollView style={styles.modalScrollView}>
              {flats
                .filter(flat => !projectId || flat.project_id === projectId)
                .map((flat) => (
                  <Button
                    key={flat.id}
                    mode="text"
                    onPress={() => {
                      setFlatId(flat.id);
                      setFlatNo(flat.flat_no);
                      setFlatMenuVisible(false);
                    }}
                    style={styles.modalButton}
                  >
                    {flat.flat_no}
                  </Button>
                ))}
            </ScrollView>
            <Button
              mode="text"
              onPress={() => {
                setFlatId(null);
                setFlatNo('');
                setFlatMenuVisible(false);
              }}
              style={styles.clearButton}
            >
              Clear Selection
            </Button>
          </Modal>
        </Portal>
      </View>

      {/* Company */}
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Company</Text>
      <View style={styles.dropdownContainer}>
        <TextInput
          label="Select Company"
          value={companyName}
          mode="outlined"
          style={styles.input}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          right={
            <TextInput.Icon
              icon="menu-down"
              onPress={() => setCompanyMenuVisible(true)}
            />
          }
          onTouchStart={() => setCompanyMenuVisible(true)}
        />
        <Portal>
          <Modal
            visible={companyMenuVisible}
            onDismiss={() => setCompanyMenuVisible(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Select Company</Text>
            <ScrollView style={styles.modalScrollView}>
              {companies.map((company) => (
                <Button
                  key={company.id}
                  mode="text"
                  onPress={() => {
                    setCompanyId(company.id);
                    setCompanyName(company.name);
                    setCompanyMenuVisible(false);
                  }}
                  style={styles.modalButton}
                >
                  {company.name}
                </Button>
              ))}
            </ScrollView>
            <Button
              mode="text"
              onPress={() => {
                setCompanyId(null);
                setCompanyName('');
                setCompanyMenuVisible(false);
              }}
              style={styles.clearButton}
            >
              Clear Selection
            </Button>
          </Modal>
        </Portal>
      </View>

      {/* Annexure A */}
      <View style={styles.annexureContainer}>
        <View style={styles.annexureHeader}>
          <Text style={[styles.annexureTitle, { color: theme.colors.onSurface }]}>Annexure A</Text>
          <Button
            mode="contained"
            onPress={() => {
              setNewItemType('A');
              setAddItemModalVisible(true);
            }}
            style={styles.addButton}
            icon="plus"
          >
            Add Item
          </Button>
        </View>

        {annexureA.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No items added yet.</Text>
        ) : (
          <ScrollView horizontal style={[styles.tableContainer, { borderColor: theme.colors.outline }]}>
            <DataTable style={styles.table}>
              <DataTable.Header style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                <DataTable.Title style={[styles.srNoColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'center' }} numeric>Sr No</DataTable.Title>
                <DataTable.Title style={[styles.descriptionColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'left' }}>Description</DataTable.Title>
                <DataTable.Title style={[styles.amountColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'right' }} numeric>Amount</DataTable.Title>
                <DataTable.Title style={styles.actionsColumn} textStyle={{ textAlign: 'center' }}>Actions</DataTable.Title>
              </DataTable.Header>

              {annexureA.map((item, index) => (
                <DataTable.Row key={index} style={[styles.tableRow, { borderBottomColor: theme.colors.outline }]}>
                  <DataTable.Cell style={[styles.srNoColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} numeric>{item.sr_no}</DataTable.Cell>
                  <DataTable.Cell style={[styles.descriptionColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]}>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={[styles.amountColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} numeric>{formatCurrency(item.amount)}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionsColumn}>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openEditItemModal('A', item)}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeAnnexureItem('A', index)}
                        style={styles.actionButton}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        )}
      </View>

      {/* Annexure B */}
      <View style={styles.annexureContainer}>
        <View style={styles.annexureHeader}>
          <Text style={[styles.annexureTitle, { color: theme.colors.onSurface }]}>Annexure B</Text>
          <Button
            mode="contained"
            onPress={() => {
              setNewItemType('B');
              setAddItemModalVisible(true);
            }}
            style={styles.addButton}
            icon="plus"
          >
            Add Item
          </Button>
        </View>

        {annexureB.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No items added yet.</Text>
        ) : (
          <ScrollView horizontal style={[styles.tableContainer, { borderColor: theme.colors.outline }]}>
            <DataTable style={styles.table}>
              <DataTable.Header style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                <DataTable.Title style={[styles.srNoColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'center' }} numeric>Sr No</DataTable.Title>
                <DataTable.Title style={[styles.descriptionColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'left' }}>Description</DataTable.Title>
                <DataTable.Title style={[styles.amountColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'right' }} numeric>Amount</DataTable.Title>
                <DataTable.Title style={styles.actionsColumn} textStyle={{ textAlign: 'center' }}>Actions</DataTable.Title>
              </DataTable.Header>

              {annexureB.map((item, index) => (
                <DataTable.Row key={index} style={[styles.tableRow, { borderBottomColor: theme.colors.outline }]}>
                  <DataTable.Cell style={[styles.srNoColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} numeric>{item.sr_no}</DataTable.Cell>
                  <DataTable.Cell style={[styles.descriptionColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]}>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={[styles.amountColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} numeric>{formatCurrency(item.amount)}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionsColumn}>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openEditItemModal('B', item)}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeAnnexureItem('B', index)}
                        style={styles.actionButton}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        )}
      </View>

      {/* Annexure C */}
      <View style={styles.annexureContainer}>
        <View style={styles.annexureHeader}>
          <Text style={[styles.annexureTitle, { color: theme.colors.onSurface }]}>Annexure C</Text>
          <Button
            mode="contained"
            onPress={() => {
              setNewItemType('C');
              setAddItemModalVisible(true);
            }}
            style={styles.addButton}
            icon="plus"
          >
            Add Item
          </Button>
        </View>

        {annexureC.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No items added yet.</Text>
        ) : (
          <ScrollView horizontal style={[styles.tableContainer, { borderColor: theme.colors.outline }]}>
            <DataTable style={styles.table}>
              <DataTable.Header style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                <DataTable.Title style={[styles.srNoColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'center' }} numeric>Sr No</DataTable.Title>
                <DataTable.Title style={[styles.descriptionColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'left' }}>Description</DataTable.Title>
                <DataTable.Title style={[styles.amountColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} textStyle={{ textAlign: 'right' }} numeric>Amount</DataTable.Title>
                <DataTable.Title style={styles.actionsColumn} textStyle={{ textAlign: 'center' }}>Actions</DataTable.Title>
              </DataTable.Header>

              {annexureC.map((item, index) => (
                <DataTable.Row key={index} style={[styles.tableRow, { borderBottomColor: theme.colors.outline }]}>
                  <DataTable.Cell style={[styles.srNoColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} numeric>{item.sr_no}</DataTable.Cell>
                  <DataTable.Cell style={[styles.descriptionColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]}>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={[styles.amountColumn, styles.cellBorder, { borderRightColor: theme.colors.outline }]} numeric>{formatCurrency(item.amount)}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionsColumn}>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openEditItemModal('C', item)}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeAnnexureItem('C', index)}
                        style={styles.actionButton}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        )}
      </View>

      {/* Total Amount */}
      <View style={styles.totalContainer}>
        <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>Total Amount:</Text>
        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
          {formatCurrency(totalAmount)}
        </Text>
      </View>

      {/* Add Item Modal */}
      <Portal>
        <Modal
          visible={addItemModalVisible}
          onDismiss={() => setAddItemModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Add Item to Annexure {newItemType}
          </Text>

          <TextInput
            label="Description"
            value={newItemDescription}
            onChangeText={setNewItemDescription}
            mode="outlined"
            style={styles.modalInput}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            multiline
          />

          <TextInput
            label="Amount"
            value={newItemAmount}
            onChangeText={setNewItemAmount}
            mode="outlined"
            style={styles.modalInput}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            keyboardType="numeric"
          />

          <View style={styles.modalButtonContainer}>
            <Button
              mode="outlined"
              onPress={() => setAddItemModalVisible(false)}
              style={styles.modalCancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={addAnnexureItem}
              style={styles.modalAddButton}
            >
              Add
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit Item Modal */}
      <Portal>
        <Modal
          visible={editItemModalVisible}
          onDismiss={() => setEditItemModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Edit Item in Annexure {editItemType}
          </Text>

          <TextInput
            label="Description"
            value={editItemDescription}
            onChangeText={setEditItemDescription}
            mode="outlined"
            style={styles.modalInput}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            multiline
          />

          <TextInput
            label="Amount"
            value={editItemAmount}
            onChangeText={setEditItemAmount}
            mode="outlined"
            style={styles.modalInput}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            keyboardType="numeric"
          />

          <View style={styles.modalButtonContainer}>
            <Button
              mode="outlined"
              onPress={() => setEditItemModalVisible(false)}
              style={styles.modalCancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={updateAnnexureItem}
              style={styles.modalAddButton}
            >
              Update
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        icon="content-save"
      >
        Save Changes
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  dateButton: {
    marginBottom: spacing.md,
  },
  dropdownContainer: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  modalContainer: {
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalButton: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  clearButton: {
    marginTop: spacing.sm,
  },
  annexureContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  annexureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  annexureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    borderRadius: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.md,
    opacity: 0.6,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 4,
  },
  table: {
    minWidth: 640, // Set minimum width for proper column alignment (wider for edit/delete actions)
  },
  tableHeader: {
    // backgroundColor will be set dynamically
    height: 48,
  },
  tableRow: {
    borderBottomWidth: 1,
    minHeight: 48,
    // borderBottomColor will be set dynamically
  },
  srNoColumn: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionColumn: {
    width: 280,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  descriptionText: {
    width: '100%',
    lineHeight: 18,
    fontSize: 14,
    textAlign: 'left',
  },
  amountColumn: {
    width: 150,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  actionsColumn: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellBorder: {
    borderRightWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    margin: 0,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: spacing.md,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    marginRight: spacing.sm,
  },
  modalAddButton: {},
  saveButton: {
    marginVertical: spacing.lg,
  },
});

export default EditQuotationScreen;
