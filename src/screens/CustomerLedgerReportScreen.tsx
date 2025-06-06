import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ActivityIndicator, Button, Dialog, Portal, List, Searchbar, Divider, FAB, IconButton } from 'react-native-paper';
import { Client, Company, UnitFlat } from '../types';
import { getClientsWithDetails, ClientWithDetails } from '../database/clientsDb';
import { getUnitPaymentRequestsByClientId } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceiptsByClientId } from '../database/unitPaymentReceiptsDb';
import { UnitPaymentRequest, UnitPaymentReceipt } from '../types';
import { spacing } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { db } from '../database/database';
import { generateAndShareCustomerLedgerPdf } from '../utils/reportUtils';
import CustomerLedgerExportModal from '../components/CustomerLedgerExportModal';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'request' | 'receipt';
  amount: number;
  mode?: string;
  remarks?: string;
}

const CustomerLedgerReportScreen = () => {
  const theme = useTheme();
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Export PDF related state
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [clientFlatDetails, setClientFlatDetails] = useState<UnitFlat | null>(null);

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
    const fetchLedgerData = async () => {
      if (selectedClient) {
        setLoading(true);
        try {
          // Fetch flat details for the client
          const flatDetails = await db.getFirstAsync<UnitFlat>(
            'SELECT * FROM units_flats WHERE client_id = ?',
            [selectedClient.id!]
          );
          setClientFlatDetails(flatDetails);

          const requests = await getUnitPaymentRequestsByClientId(selectedClient.id!);
          const receipts = await getUnitPaymentReceiptsByClientId(selectedClient.id!);

          const formattedRequests: LedgerEntry[] = requests.map(req => ({
            id: `req-${req.id ?? 0}`,
            date: new Date(req.date).toLocaleDateString(),
            description: `Payment Request: ${req.description || 'N/A'}`,
            type: 'request',
            amount: req.amount,
          }));

          const formattedReceipts: LedgerEntry[] = receipts.map(rec => ({
            id: `rec-${rec.id ?? 0}`,
            date: new Date(rec.date).toLocaleDateString(),
            description: `Payment Receipt: ${rec.description || 'N/A'}`,
            type: 'receipt',
            amount: rec.amount,
            mode: rec.mode,
            remarks: rec.remarks,
          }));

          const combinedData = [...formattedRequests, ...formattedReceipts].sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });

          setLedgerData(combinedData);
        } catch (error) {
          console.error('Error fetching ledger data:', error);
          setLedgerData([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLedgerData([]);
      }
    };
    fetchLedgerData();
  }, [selectedClient]);

  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => setDialogVisible(false);

  const showExportModal = () => setExportModalVisible(true);
  const hideExportModal = () => setExportModalVisible(false);

  const handleExport = async (letterheadOption: 'none' | 'company', companyId?: number) => {
    hideExportModal();

    if (!selectedClient) {
      return;
    }

    try {
      console.log(`Exporting PDF with letterhead option: ${letterheadOption}, company ID: ${companyId}`);
      await generateAndShareCustomerLedgerPdf(
        selectedClient,
        ledgerData,
        balanceAmount,
        totalAmountReceived,
        clientFlatDetails?.flat_value,
        totalBalancePayable,
        companyId,
        letterheadOption
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate the balance amount
  const balanceAmount = useMemo(() => {
    return ledgerData.reduce((total, item) => {
      // Add receipts, subtract requests
      return total + (item.type === 'receipt' ? item.amount : -item.amount);
    }, 0);
  }, [ledgerData]);

  // Calculate total amount received (sum of all payment receipts)
  const totalAmountReceived = useMemo(() => {
    return ledgerData.reduce((total, item) => {
      return total + (item.type === 'receipt' ? item.amount : 0);
    }, 0);
  }, [ledgerData]);

  // Calculate total balance payable of flat value (Flat value - total amount received)
  const totalBalancePayable = useMemo(() => {
    const flatValue = clientFlatDetails?.flat_value || 0;
    return flatValue - totalAmountReceived;
  }, [clientFlatDetails?.flat_value, totalAmountReceived]);

  const renderLedgerItem = ({ item }: { item: LedgerEntry }) => (
    <View style={styles.ledgerItem}>
      <View style={styles.ledgerMainRow}>
        <Text style={styles.ledgerDate}>{item.date}</Text>
        <Text style={styles.ledgerDescription}>{item.description}</Text>
        <Text style={[styles.ledgerAmount, { color: item.type === 'receipt' ? theme.colors.primary : theme.colors.error }]}>
          {item.type === 'receipt' ? '+' : '-'} ₹{item.amount.toFixed(2)}
        </Text>
      </View>
      {item.type === 'receipt' && (item.mode || item.remarks) && (
        <View style={styles.receiptDetails}>
          {item.mode && (
            <Text style={[styles.receiptDetailText, { color: theme.colors.onSurfaceVariant }]}>
              Mode: {item.mode}
            </Text>
          )}
          {item.remarks && (
            <Text style={[styles.receiptDetailText, { color: theme.colors.onSurfaceVariant }]}>
              Remarks: {item.remarks}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderHeader = () => {
    if (!selectedClient || !clientFlatDetails) return null;

    return (
      <View style={styles.flatValueContainer}>
        <Text style={[styles.flatValueLabel, { color: theme.colors.onSurface }]}>
          Flat Value:
        </Text>
        <Text style={[styles.flatValueAmount, { color: theme.colors.primary }]}>
          {formatCurrency(clientFlatDetails.flat_value || 0)}
        </Text>
        <Divider style={styles.divider} />
      </View>
    );
  };

  const renderFooter = () => {
    if (ledgerData.length === 0) return null;

    return (
      <View style={styles.balanceContainer}>
        <Divider style={styles.divider} />
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance Amount:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: balanceAmount >= 0 ? theme.colors.primary : theme.colors.error }
          ]}>
            {formatCurrency(balanceAmount)}
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Total Amount Received:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: theme.colors.primary }
          ]}>
            {formatCurrency(totalAmountReceived)}
          </Text>
        </View>
        <View style={styles.balanceRowMultiLine}>
          <Text style={styles.balanceLabelMultiLine}>Total Balance Payable{'\n'}of Flat Value:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: totalBalancePayable >= 0 ? theme.colors.primary : theme.colors.error }
          ]}>
            {formatCurrency(totalBalancePayable)}
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

        {selectedClient && (
          <Button
            mode="contained"
            onPress={showExportModal}
            icon="file-pdf-box"
            style={styles.exportButton}
          >
            Export PDF
          </Button>
        )}
      </View>

      {loading ? (
        <ActivityIndicator animating={true} color={theme.colors.primary} style={styles.loadingIndicator} />
      ) : selectedClient ? (
        <FlatList
          data={ledgerData}
          keyExtractor={(item) => item.id}
          renderItem={renderLedgerItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>No ledger entries found for this client.</Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Please select a client to view their ledger.</Text>
        </View>
      )}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Select a Client</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Search Clients"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => (item.id ?? 0).toString()}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  titleStyle={{ fontWeight: 'bold' }}
                  description={
                    item.project_name && item.flat_no
                      ? `${item.project_name} - Unit/Flat: ${item.flat_no}`
                      : item.project_name
                      ? `${item.project_name}`
                      : item.flat_no
                      ? `Unit/Flat: ${item.flat_no}`
                      : undefined
                  }
                  descriptionStyle={{ color: theme.colors.secondary }}
                  onPress={() => {
                    setSelectedClient(item);
                    hideDialog();
                  }}
                />
              )}
              ListEmptyComponent={<Text>No clients found.</Text>}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Customer Ledger Export Modal */}
        <CustomerLedgerExportModal
          visible={exportModalVisible}
          onDismiss={hideExportModal}
          onExport={handleExport}
        />
      </Portal>
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
  exportButton: {
    marginLeft: spacing.sm,
  },
  loadingIndicator: {
    marginTop: spacing.lg,
  },
  listContentContainer: {
    flexGrow: 1,
  },
  ledgerItem: {
    flexDirection: 'column',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ledgerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerDate: {
    fontSize: 14,
    width: '25%',
  },
  ledgerDescription: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: spacing.sm,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    width: '20%',
    textAlign: 'right',
  },
  receiptDetails: {
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
  },
  receiptDetailText: {
    fontSize: 12,
    marginBottom: 2,
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
  balanceRowMultiLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceLabelMultiLine: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.md,
    lineHeight: 22,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    minWidth: 120,
  },
});

export default CustomerLedgerReportScreen;
