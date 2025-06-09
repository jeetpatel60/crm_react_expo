import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import {
  Text,
  useTheme,
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  List,
  Searchbar,
  Divider,
  FAB
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing } from '../constants/theme';
import { formatDate, formatCurrency } from '../utils/formatters';
import { UnitGstRecord, getUnitGstRecords } from '../database/unitGstRecordsDb';
import { getUnitsFlats, UnitFlat } from '../database/unitsFlatDb';
import { getProjects, Project } from '../database/projectsDb';
import { getClientsWithDetails, ClientWithDetails } from '../database/clientsDb';
import { generateAndShareGstReportPdf } from '../utils/reportUtils';
import CustomerLedgerExportModal from '../components/CustomerLedgerExportModal';

interface GstEntry {
  id: string;
  date: string;
  remarks: string;
  credit: number;
  debit: number;
  srNo: number;
}

const GstReportScreen = () => {
  const theme = useTheme();

  // State
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientWithDetails | null>(null);
  const [gstData, setGstData] = useState<GstEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFlatDetails, setClientFlatDetails] = useState<UnitFlat | null>(null);

  // Export PDF related state
  const [exportModalVisible, setExportModalVisible] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const fetchedClients = await getClientsWithDetails();
        setClients(fetchedClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    const fetchGstData = async () => {
      if (selectedClient) {
        setLoading(true);
        try {
          // Fetch flat details for the client
          const flatDetails = await getUnitsFlats();
          const clientFlat = flatDetails.find(flat => flat.client_id === selectedClient.id);
          setClientFlatDetails(clientFlat || null);

          if (clientFlat) {
            // Fetch GST records for this client's unit
            const gstRecords = await getUnitGstRecords(clientFlat.id!);

            // Create entries array with initial debit entry for total GST value
            const transformedData: GstEntry[] = [];

            // Add initial debit entry for total GST value
            if (clientFlat.gst_amount && clientFlat.gst_amount > 0) {
              transformedData.push({
                id: 'initial-debit',
                date: '', // No date for debit entry
                remarks: 'Total GST Value',
                credit: 0,
                debit: clientFlat.gst_amount,
                srNo: 0,
              });
            }

            // Transform GST records to credit entries
            const creditEntries: GstEntry[] = gstRecords.map(record => ({
              id: record.id!.toString(),
              date: record.date ? formatDate(record.date) : '',
              remarks: record.remarks || 'GST Payment',
              credit: record.r_amount,
              debit: 0,
              srNo: record.sr_no,
            }));

            // Combine and sort by serial number
            transformedData.push(...creditEntries);
            transformedData.sort((a, b) => a.srNo - b.srNo);

            setGstData(transformedData);
          } else {
            setGstData([]);
          }
        } catch (error) {
          console.error('Error fetching GST data:', error);
          setGstData([]);
        } finally {
          setLoading(false);
        }
      } else {
        setGstData([]);
      }
    };

    fetchGstData();
  }, [selectedClient]);

  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => setDialogVisible(false);
  const showExportModal = () => setExportModalVisible(true);
  const hideExportModal = () => setExportModalVisible(false);

  const handleClientSelect = (client: ClientWithDetails) => {
    setSelectedClient(client);
    hideDialog();
  };

  const handleExport = async (letterheadOption: 'none' | 'company', companyId?: number) => {
    hideExportModal();

    if (!selectedClient || !clientFlatDetails) {
      return;
    }

    try {
      console.log(`Exporting GST Report PDF with letterhead option: ${letterheadOption}, company ID: ${companyId}`);

      // Calculate totals
      const totalDebit = gstData.reduce((total, item) => total + item.debit, 0);
      const totalCredit = gstData.reduce((total, item) => total + item.credit, 0);
      const balanceToCollect = totalDebit - totalCredit;

      await generateAndShareGstReportPdf(
        selectedClient,
        gstData,
        clientFlatDetails.gst_amount || 0,
        totalDebit,
        totalCredit,
        balanceToCollect,
        balanceToCollect,
        clientFlatDetails.flat_no,
        companyId,
        letterheadOption
      );
    } catch (error) {
      console.error('Error exporting GST Report PDF:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalCredit = useMemo(() => {
    return gstData.reduce((total, item) => total + item.credit, 0);
  }, [gstData]);

  const totalDebit = useMemo(() => {
    return gstData.reduce((total, item) => total + item.debit, 0);
  }, [gstData]);

  const balanceToCollect = useMemo(() => {
    return totalDebit - totalCredit;
  }, [totalDebit, totalCredit]);



  const renderGstItem = ({ item }: { item: GstEntry }) => (
    <View style={styles.gstItem}>
      <View style={styles.gstMainRow}>
        <View style={styles.gstSerialSection}>
          <Text style={[styles.gstSerial, { color: theme.colors.onSurface }]}>
            {item.srNo === 0 ? '-' : item.srNo}
          </Text>
        </View>
        <View style={styles.gstDateSection}>
          <Text style={[styles.gstDate, { color: theme.colors.onSurface }]}>{item.date || '-'}</Text>
        </View>
        <View style={styles.gstDebitSection}>
          <Text style={[styles.gstDebit, { color: item.debit > 0 ? '#F44336' : theme.colors.onSurfaceVariant }]}>
            {item.debit > 0 ? formatCurrency(item.debit) : '-'}
          </Text>
        </View>
        <View style={styles.gstCreditSection}>
          <Text style={[styles.gstCredit, { color: item.credit > 0 ? '#4CAF50' : theme.colors.onSurfaceVariant }]}>
            {item.credit > 0 ? formatCurrency(item.credit) : '-'}
          </Text>
        </View>
        <View style={styles.gstRemarksSection}>
          <Text style={[styles.gstRemarks, { color: theme.colors.onSurface }]}>
            {item.remarks}
          </Text>
        </View>
      </View>
    </View>
  );



  const renderFooter = () => {
    if (!selectedClient || !clientFlatDetails) return null;

    return (
      <View style={styles.balanceContainer}>
        <Divider style={styles.divider} />
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Total R. Amount:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: '#4CAF50' }
          ]}>
            {formatCurrency(totalCredit)}
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance to be Collected:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: balanceToCollect > 0 ? '#F44336' : '#4CAF50' }
          ]}>
            {formatCurrency(balanceToCollect)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerButtons}>
        <Button
          mode="outlined"
          onPress={showDialog}
          style={styles.selectClientButton}
        >
          {selectedClient ?
            `${selectedClient.name}${(selectedClient as ClientWithDetails).project_name ?
              ` - ${(selectedClient as ClientWithDetails).project_name}` : ''}${
              (selectedClient as ClientWithDetails).flat_no ?
              ` - ${(selectedClient as ClientWithDetails).flat_no}` : ''}`
            : 'Select Client'}
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator animating={true} color={theme.colors.primary} style={styles.loadingIndicator} />
      ) : selectedClient ? (
        <View style={styles.reportContainer}>
          {/* Client Info - Fixed */}
          <View style={styles.clientInfoContainer}>
            <Text style={[styles.clientInfoText, { color: theme.colors.onSurfaceVariant }]}>
              Client: {selectedClient.name}
            </Text>
            <Text style={[styles.clientInfoText, { color: theme.colors.onSurfaceVariant }]}>
              Project: {(selectedClient as ClientWithDetails).project_name || 'N/A'}
            </Text>
            <Text style={[styles.clientInfoText, { color: theme.colors.onSurfaceVariant }]}>
              Flat: {clientFlatDetails?.flat_no}
            </Text>
          </View>

          {/* Table - Horizontally Scrollable */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScrollView}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={styles.gstSerialSection}>
                  <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>Sr No</Text>
                </View>
                <View style={styles.gstDateSection}>
                  <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>Date</Text>
                </View>
                <View style={styles.gstDebitSection}>
                  <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>Debit</Text>
                </View>
                <View style={styles.gstCreditSection}>
                  <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>Credit</Text>
                </View>
                <View style={styles.gstRemarksSection}>
                  <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>Remarks</Text>
                </View>
              </View>

              {/* Table Content */}
              <FlatList
                data={gstData}
                keyExtractor={(item) => item.id}
                renderItem={renderGstItem}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>No GST records found for this client.</Text>
                  </View>
                }
                contentContainerStyle={styles.listContentContainer}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>

          {/* Footer - Fixed */}
          {renderFooter()}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Please select a client to view their GST records.</Text>
        </View>
      )}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Select Client</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Search clients..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id!.toString()}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  description={`${item.project_name || 'No Project'} - ${item.flat_no || 'No Flat'}`}
                  onPress={() => handleClientSelect(item)}
                />
              )}
              style={{ maxHeight: 300 }}
              ListEmptyComponent={<Text>No clients found.</Text>}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* GST Report Export Modal */}
        <CustomerLedgerExportModal
          visible={exportModalVisible}
          onDismiss={hideExportModal}
          onExport={handleExport}
        />
      </Portal>

      {/* Floating Action Button for PDF Export */}
      {selectedClient && (
        <FAB
          icon="file-pdf-box"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={showExportModal}
          label="Export PDF"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectClientButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl * 1.5,
    left: spacing.lg,
  },
  loadingIndicator: {
    marginTop: spacing.lg,
  },
  listContentContainer: {
    flexGrow: 1,
  },
  reportContainer: {
    flex: 1,
  },
  horizontalScrollView: {
    flexGrow: 0,
  },
  tableContainer: {
    minWidth: 680, // Minimum width to accommodate all columns
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    marginBottom: spacing.xs,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gstItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gstMainRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  gstSerialSection: {
    width: 80,
    alignItems: 'center',
  },
  gstDateSection: {
    width: 120,
    alignItems: 'center',
  },
  gstCreditSection: {
    width: 140,
    alignItems: 'center',
  },
  gstDebitSection: {
    width: 140,
    alignItems: 'center',
  },
  gstRemarksSection: {
    width: 200,
    paddingLeft: spacing.sm,
  },
  gstSerial: {
    fontSize: 14,
    textAlign: 'center',
  },
  gstDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  gstCredit: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gstDebit: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gstRemarks: {
    fontSize: 14,
    lineHeight: 18,
  },
  flatValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  flatValueLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flatValueAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientInfoContainer: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientInfoText: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  searchBar: {
    marginBottom: spacing.sm,
  },
  // Balance amount styles
  balanceContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    minWidth: 120,
  },
});

export default GstReportScreen;
