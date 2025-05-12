import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, IconButton, DataTable, FAB, useTheme, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TemplateSelectionModal, AgreementTemplateSelectionModal, StatusBadge } from '../components';

import { RootStackParamList } from '../types';
import { UnitFlat } from '../database/unitsFlatDb';
import { UnitCustomerSchedule } from '../database/unitCustomerSchedulesDb';
import { UnitPaymentRequest } from '../database/unitPaymentRequestsDb';
import { UnitPaymentReceipt } from '../database/unitPaymentReceiptsDb';
import { getUnitFlatById, getUnitFlatWithDetails } from '../database/unitsFlatDb';
import { getUnitCustomerSchedules, deleteUnitCustomerSchedule } from '../database/unitCustomerSchedulesDb';
import { getUnitPaymentRequests, deleteUnitPaymentRequest } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceipts, deleteUnitPaymentReceipt } from '../database/unitPaymentReceiptsDb';
import { getProjectById } from '../database/projectsDb';
import { getClientById } from '../database/clientsDb';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateAndSharePaymentRequestPdf } from '../utils/pdfUtils';
import { generateAndShareDocxDocument } from '../utils/docxUtils';

type UnitFlatDetailsScreenRouteProp = RouteProp<RootStackParamList, 'UnitFlatDetails'>;
type UnitFlatDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const UnitFlatDetailsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<UnitFlatDetailsScreenNavigationProp>();
  const route = useRoute<UnitFlatDetailsScreenRouteProp>();
  const { unitId } = route.params;

  const [unit, setUnit] = useState<UnitFlat | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [customerSchedules, setCustomerSchedules] = useState<UnitCustomerSchedule[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<UnitPaymentRequest[]>([]);
  const [paymentReceipts, setPaymentReceipts] = useState<UnitPaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [agreementTemplateModalVisible, setAgreementTemplateModalVisible] = useState(false);
  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch unit details with project and client names
      const unitData = await getUnitFlatWithDetails(unitId);
      if (!unitData) {
        Alert.alert('Error', 'Unit not found');
        navigation.goBack();
        return;
      }
      setUnit(unitData);

      // Set project name
      if (unitData.project_name) {
        setProjectName(unitData.project_name);
      }

      // Set client name
      if (unitData.client_name) {
        setClientName(unitData.client_name);
      } else {
        setClientName('');
      }

      // Fetch customer schedules
      const schedulesData = await getUnitCustomerSchedules(unitId);
      setCustomerSchedules(schedulesData);

      // Fetch payment requests
      const requestsData = await getUnitPaymentRequests(unitId);
      setPaymentRequests(requestsData);

      // Fetch payment receipts
      const receiptsData = await getUnitPaymentReceipts(unitId);
      setPaymentReceipts(receiptsData);
    } catch (error) {
      console.error('Error loading unit details:', error);
      Alert.alert('Error', 'Failed to load unit details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [unitId, navigation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteCustomerSchedule = (scheduleId: number) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUnitCustomerSchedule(scheduleId);
              Alert.alert('Success', 'Schedule deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const handleDeletePaymentRequest = (requestId: number) => {
    Alert.alert(
      'Delete Payment Request',
      'Are you sure you want to delete this payment request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUnitPaymentRequest(requestId);
              Alert.alert('Success', 'Payment request deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting payment request:', error);
              Alert.alert('Error', 'Failed to delete payment request');
            }
          },
        },
      ]
    );
  };

  const handleDeletePaymentReceipt = (receiptId: number) => {
    Alert.alert(
      'Delete Payment Receipt',
      'Are you sure you want to delete this payment receipt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUnitPaymentReceipt(receiptId);
              Alert.alert('Success', 'Payment receipt deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting payment receipt:', error);
              Alert.alert('Error', 'Failed to delete payment receipt');
            }
          },
        },
      ]
    );
  };

  const handleExportPaymentRequest = (requestId: number) => {
    setSelectedPaymentRequestId(requestId);
    setTemplateModalVisible(true);
  };

  const handleTemplateSelect = async (templateId: number) => {
    setTemplateModalVisible(false);

    if (selectedPaymentRequestId) {
      try {
        await generateAndSharePaymentRequestPdf(
          selectedPaymentRequestId,
          templateId
        );
      } catch (error) {
        console.error('Error exporting payment request:', error);
        Alert.alert('Error', 'Failed to export payment request');
      }
    }
  };

  const handleExportAgreement = () => {
    if (!unit) return;

    // Check if unit is sold and has a client
    if (unit.status !== 'Sold' || !unit.client_id) {
      Alert.alert(
        'Cannot Generate Agreement',
        'Agreement can only be generated for units with status "Sold" and a selected client.'
      );
      return;
    }

    setAgreementTemplateModalVisible(true);
  };

  const handleAgreementTemplateSelect = async (templateId: number) => {
    setAgreementTemplateModalVisible(false);

    try {
      if (!unit) return;

      const project = await getProjectById(unit.project_id);

      if (!project) {
        Alert.alert('Error', 'Project information not found');
        return;
      }

      // Use the project's company_id for the letterhead and include client_id
      await generateAndShareDocxDocument(
        templateId,
        unit.id,
        unit.client_id,
        project.id,
        project.company_id
      );
    } catch (error) {
      console.error('Error exporting agreement:', error);
      Alert.alert('Error', 'Failed to export agreement');
    }
  };

  if (loading || !unit) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {/* Unit Details Card */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text variant="titleLarge" style={styles.title}>
                  {unit.flat_no}
                </Text>
                <StatusBadge
                  status={unit.status}
                  size="medium"
                  showIcon={true}
                />
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="file-document-outline"
                  size={20}
                  onPress={handleExportAgreement}
                  iconColor={theme.colors.primary}
                />
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => navigation.navigate('EditUnitFlat', { unit })}
                />
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="office-building"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                Project: {projectName}
              </Text>
            </View>

            {clientName && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="account"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text variant="bodyMedium" style={styles.infoText}>
                  Client: {clientName}
                </Text>
              </View>
            )}

            {unit.type && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="home-variant"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text variant="bodyMedium" style={styles.infoText}>
                  Type: {unit.type}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="ruler-square"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                Area: {unit.area_sqft} sqft @ ₹{unit.rate_per_sqft}/sqft
              </Text>
            </View>

            <View style={styles.financialInfo}>
              <View style={styles.financialItem}>
                <Text variant="labelSmall" style={styles.financialLabel}>
                  Flat Value
                </Text>
                <Text variant="titleSmall" style={styles.financialValue}>
                  {formatCurrency(unit.flat_value || 0)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text variant="labelSmall" style={styles.financialLabel}>
                  Received
                </Text>
                <Text variant="titleSmall" style={styles.financialValue}>
                  {formatCurrency(unit.received_amount || 0)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text variant="labelSmall" style={styles.financialLabel}>
                  Balance
                </Text>
                <Text variant="titleSmall" style={styles.financialValue}>
                  {formatCurrency(unit.balance_amount || 0)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Customer Schedule Section */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Customer Schedule
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('AddUnitCustomerSchedule', { unitId })}
                style={styles.addButton}
                icon="plus"
                compact
              >
                Add
              </Button>
            </View>

            {customerSchedules.length === 0 ? (
              <Text style={styles.emptyText}>No customer schedules added yet.</Text>
            ) : (
              <ScrollView
                horizontal
                style={styles.tableContainer}
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <DataTable style={styles.table}>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title style={styles.srNoColumn} textStyle={{textAlign: 'center'}}>Sr No</DataTable.Title>
                    <DataTable.Title style={styles.milestoneColumn} textStyle={{textAlign: 'center'}}>Milestone</DataTable.Title>
                    <DataTable.Title style={styles.completionColumn} textStyle={{textAlign: 'center'}}>% Completion</DataTable.Title>
                    <DataTable.Title style={styles.amountColumn} textStyle={{textAlign: 'center'}}>Amount</DataTable.Title>
                    <DataTable.Title style={styles.statusColumn} textStyle={{textAlign: 'center'}}>Status</DataTable.Title>
                    <DataTable.Title style={styles.actionsColumn} textStyle={{textAlign: 'center'}}>Actions</DataTable.Title>
                  </DataTable.Header>

                  {customerSchedules.map((schedule) => (
                    <DataTable.Row key={schedule.id} style={styles.tableRow}>
                      <DataTable.Cell style={styles.srNoColumn} textStyle={{textAlign: 'center'}}>{schedule.sr_no}</DataTable.Cell>
                      <DataTable.Cell style={styles.milestoneColumn} textStyle={{textAlign: 'center'}}>{schedule.milestone}</DataTable.Cell>
                      <DataTable.Cell style={styles.completionColumn} textStyle={{textAlign: 'center'}}>{schedule.completion_percentage}%</DataTable.Cell>
                      <DataTable.Cell style={styles.amountColumn} textStyle={{textAlign: 'center'}}>{formatCurrency(schedule.amount || 0)}</DataTable.Cell>
                      <DataTable.Cell style={styles.statusColumn}>
                        <View style={{alignItems: 'center', width: '100%'}}>
                          <StatusBadge
                            status={schedule.status}
                            size="small"
                            showIcon={true}
                          />
                        </View>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.actionsColumn}>
                        <View style={styles.actionButtons}>
                          <IconButton
                            icon="pencil"
                            size={16}
                            onPress={() => navigation.navigate('EditUnitCustomerSchedule', { schedule })}
                            style={styles.actionButton}
                          />
                          <IconButton
                            icon="delete"
                            size={16}
                            onPress={() => handleDeleteCustomerSchedule(schedule.id!)}
                            style={styles.actionButton}
                          />
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        {/* Payment Requests Section */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Payment Requests
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('AddUnitPaymentRequest', { unitId })}
                style={styles.addButton}
                icon="plus"
                compact
              >
                Add
              </Button>
            </View>

            {paymentRequests.length === 0 ? (
              <Text style={styles.emptyText}>No payment requests added yet.</Text>
            ) : (
              <ScrollView
                horizontal
                style={styles.tableContainer}
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <DataTable style={styles.table}>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title style={styles.srNoColumn} textStyle={{textAlign: 'center'}}>Sr No</DataTable.Title>
                    <DataTable.Title style={styles.dateColumn} textStyle={{textAlign: 'center'}}>Date</DataTable.Title>
                    <DataTable.Title style={styles.descriptionColumn} textStyle={{textAlign: 'center'}}>Description</DataTable.Title>
                    <DataTable.Title style={styles.amountColumn} textStyle={{textAlign: 'center'}}>Amount</DataTable.Title>
                    <DataTable.Title style={styles.actionsColumn} textStyle={{textAlign: 'center'}}>Actions</DataTable.Title>
                  </DataTable.Header>

                  {paymentRequests.map((request) => (
                    <DataTable.Row key={request.id} style={styles.tableRow}>
                      <DataTable.Cell style={styles.srNoColumn} textStyle={{textAlign: 'center'}}>{request.sr_no}</DataTable.Cell>
                      <DataTable.Cell style={styles.dateColumn} textStyle={{textAlign: 'center'}}>{formatDate(request.date)}</DataTable.Cell>
                      <DataTable.Cell style={styles.descriptionColumn} textStyle={{textAlign: 'center'}}>{request.description || '-'}</DataTable.Cell>
                      <DataTable.Cell style={styles.amountColumn} textStyle={{textAlign: 'center'}}>{formatCurrency(request.amount)}</DataTable.Cell>
                      <DataTable.Cell style={styles.actionsColumn}>
                        <View style={styles.actionButtons}>
                          <IconButton
                            icon="pencil"
                            size={16}
                            onPress={() => navigation.navigate('EditUnitPaymentRequest', { request })}
                            style={styles.actionButton}
                          />
                          <IconButton
                            icon="delete"
                            size={16}
                            onPress={() => handleDeletePaymentRequest(request.id!)}
                            style={styles.actionButton}
                          />
                          <IconButton
                            icon="file-pdf-box"
                            size={16}
                            onPress={() => handleExportPaymentRequest(request.id!)}
                            style={styles.actionButton}
                            iconColor={theme.colors.primary}
                          />
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        {/* Payment Receipts Section */}
        <Card style={[styles.card, shadows.md]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Payment Receipts
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('AddUnitPaymentReceipt', { unitId })}
                style={styles.addButton}
                icon="plus"
                compact
              >
                Add
              </Button>
            </View>

            {paymentReceipts.length === 0 ? (
              <Text style={styles.emptyText}>No payment receipts added yet.</Text>
            ) : (
              <ScrollView
                horizontal
                style={styles.tableContainer}
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <DataTable style={[styles.table, { minWidth: 800 }]}>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title style={styles.srNoColumn} textStyle={{textAlign: 'center'}}>Sr No</DataTable.Title>
                    <DataTable.Title style={styles.dateColumn} textStyle={{textAlign: 'center'}}>Date</DataTable.Title>
                    <DataTable.Title style={styles.descriptionColumn} textStyle={{textAlign: 'center'}}>Description</DataTable.Title>
                    <DataTable.Title style={styles.amountColumn} textStyle={{textAlign: 'center'}}>Amount</DataTable.Title>
                    <DataTable.Title style={styles.modeColumn} textStyle={{textAlign: 'center'}}>Mode</DataTable.Title>
                    <DataTable.Title style={styles.remarksColumn} textStyle={{textAlign: 'center'}}>Remarks</DataTable.Title>
                    <DataTable.Title style={styles.actionsColumn} textStyle={{textAlign: 'center'}}>Actions</DataTable.Title>
                  </DataTable.Header>

                  {paymentReceipts.map((receipt) => (
                    <DataTable.Row key={receipt.id} style={styles.tableRow}>
                      <DataTable.Cell style={styles.srNoColumn} textStyle={{textAlign: 'center'}}>{receipt.sr_no}</DataTable.Cell>
                      <DataTable.Cell style={styles.dateColumn} textStyle={{textAlign: 'center'}}>{formatDate(receipt.date)}</DataTable.Cell>
                      <DataTable.Cell style={styles.descriptionColumn} textStyle={{textAlign: 'center'}}>{receipt.description || '-'}</DataTable.Cell>
                      <DataTable.Cell style={styles.amountColumn} textStyle={{textAlign: 'center'}}>{formatCurrency(receipt.amount)}</DataTable.Cell>
                      <DataTable.Cell style={styles.modeColumn} textStyle={{textAlign: 'center'}}>{receipt.mode || '-'}</DataTable.Cell>
                      <DataTable.Cell style={styles.remarksColumn} textStyle={{textAlign: 'center'}}>{receipt.remarks || '-'}</DataTable.Cell>
                      <DataTable.Cell style={styles.actionsColumn}>
                        <View style={styles.actionButtons}>
                          <IconButton
                            icon="pencil"
                            size={16}
                            onPress={() => navigation.navigate('EditUnitPaymentReceipt', { receipt })}
                            style={styles.actionButton}
                          />
                          <IconButton
                            icon="delete"
                            size={16}
                            onPress={() => handleDeletePaymentReceipt(receipt.id!)}
                            style={styles.actionButton}
                          />
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </ScrollView>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Payment Request Template Selection Modal */}
      <TemplateSelectionModal
        visible={templateModalVisible}
        onDismiss={() => setTemplateModalVisible(false)}
        onSelect={handleTemplateSelect}
        title="Select Payment Request Template"
      />

      {/* Agreement Template Selection Modal */}
      <AgreementTemplateSelectionModal
        visible={agreementTemplateModalVisible}
        onDismiss={() => setAgreementTemplateModalVisible(false)}
        onSelect={handleAgreementTemplateSelect}
        title="Select Agreement Template"
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
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 28,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    marginLeft: spacing.xs,
    color: '#666',
  },
  financialInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    color: '#666',
    marginBottom: 2,
  },
  financialValue: {
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  addButton: {
    borderRadius: borderRadius.sm,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  tableContainer: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
  },
  table: {
    minWidth: 650, // Set a minimum width to ensure all columns are visible
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  srNoColumn: {
    width: 60,
    justifyContent: 'center',
  },
  milestoneColumn: {
    width: 180,
    justifyContent: 'center',
  },
  completionColumn: {
    width: 100,
    justifyContent: 'center',
  },
  amountColumn: {
    width: 120,
    justifyContent: 'center',
  },
  statusColumn: {
    width: 150,
    justifyContent: 'center',
  },
  dateColumn: {
    width: 100,
    justifyContent: 'center',
  },
  descriptionColumn: {
    width: 180,
    justifyContent: 'center',
  },
  modeColumn: {
    width: 100,
    justifyContent: 'center',
  },
  remarksColumn: {
    width: 150,
    justifyContent: 'center',
  },
  actionsColumn: {
    width: 100,
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    margin: 0,
  },
});

export default UnitFlatDetailsScreen;
