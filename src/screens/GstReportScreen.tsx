import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
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
  description: string;
  amount: number;
  rAmount: number;
  status: string;
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

            // Transform to GstEntry format
            const transformedData: GstEntry[] = gstRecords.map(record => ({
              id: record.id!.toString(),
              date: formatDate(new Date(record.date)),
              description: record.description || 'GST Record',
              amount: record.amount,
              rAmount: record.r_amount,
              status: record.status,
              srNo: record.sr_no,
            }));

            // Sort by date (newest first)
            transformedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
      const overallGstBalance = (clientFlatDetails.gst_amount || 0) - totalReceivedAmount;

      await generateAndShareGstReportPdf(
        selectedClient,
        gstData,
        clientFlatDetails.gst_amount || 0,
        totalGstAmount,
        totalReceivedAmount,
        totalPendingAmount,
        overallGstBalance,
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
  const totalGstAmount = useMemo(() => {
    return gstData.reduce((total, item) => total + item.amount, 0);
  }, [gstData]);

  const totalReceivedAmount = useMemo(() => {
    return gstData.reduce((total, item) => total + item.rAmount, 0);
  }, [gstData]);

  const totalPendingAmount = useMemo(() => {
    return totalGstAmount - totalReceivedAmount;
  }, [totalGstAmount, totalReceivedAmount]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received':
        return theme.colors.primary;
      case 'Partially Received':
        return '#FF9800';
      case 'Not Received':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const renderGstItem = ({ item }: { item: GstEntry }) => (
    <View style={styles.gstItem}>
      <View style={styles.gstMainRow}>
        <View style={styles.gstLeftSection}>
          <Text style={styles.gstDate}>{item.date}</Text>
          <Text style={styles.gstDescription}>
            Sr.{item.srNo} - {item.description}
          </Text>
        </View>
        <View style={styles.gstRightSection}>
          <Text style={[styles.gstAmount, { color: theme.colors.primary }]}>
            {formatCurrency(item.amount)}
          </Text>
          <Text style={[styles.gstStatus, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.gstDetailsRow}>
        <Text style={[styles.gstDetailText, { color: theme.colors.onSurfaceVariant }]}>
          R. Amount: {formatCurrency(item.rAmount)}
        </Text>
        <Text style={[styles.gstDetailText, { color: theme.colors.onSurfaceVariant }]}>
          Balance: {formatCurrency(item.amount - item.rAmount)}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => {
    if (!selectedClient || !clientFlatDetails) return null;

    return (
      <View>
        <View style={styles.flatValueContainer}>
          <Text style={[styles.flatValueLabel, { color: theme.colors.onSurface }]}>
            Total GST Value:
          </Text>
          <Text style={[styles.flatValueAmount, { color: theme.colors.primary }]}>
            {formatCurrency(clientFlatDetails.gst_amount || 0)}
          </Text>
        </View>
        <View style={styles.clientInfoContainer}>
          <Text style={[styles.clientInfoText, { color: theme.colors.onSurfaceVariant }]}>
            Client: {selectedClient.name}
          </Text>
          <Text style={[styles.clientInfoText, { color: theme.colors.onSurfaceVariant }]}>
            Unit: {clientFlatDetails.flat_no}
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!selectedClient || !clientFlatDetails) return null;

    // Calculate Overall GST Balance: Total GST Value - Total R. Amount Received
    const overallGstBalance = (clientFlatDetails.gst_amount || 0) - totalReceivedAmount;

    return (
      <View style={styles.balanceContainer}>
        <Divider style={styles.divider} />
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Total Collection Amount:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: theme.colors.primary }
          ]}>
            {formatCurrency(totalGstAmount)}
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Total R. Amount Received:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: theme.colors.primary }
          ]}>
            {formatCurrency(totalReceivedAmount)}
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Total Balance Amount:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: theme.colors.error }
          ]}>
            {formatCurrency(totalPendingAmount)}
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Overall GST Balance:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: overallGstBalance >= 0 ? theme.colors.error : theme.colors.primary }
          ]}>
            {formatCurrency(overallGstBalance)}
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
        <FlatList
          data={gstData}
          keyExtractor={(item) => item.id}
          renderItem={renderGstItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>No GST records found for this client.</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContentContainer}
        />
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
  gstItem: {
    flexDirection: 'column',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  gstMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gstLeftSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  gstRightSection: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  gstDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  gstDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  gstAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 2,
  },
  gstStatus: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
  gstDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
  },
  gstDetailText: {
    fontSize: 12,
    flex: 1,
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
