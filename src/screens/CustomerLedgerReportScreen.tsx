import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ActivityIndicator, Button, Dialog, Portal, List, Searchbar, Divider, FAB } from 'react-native-paper';
import { Client, UnitFlat } from '../types';
import { getClientsWithDetails, ClientWithDetails } from '../database/clientsDb';
import { getUnitPaymentRequestsByClientId } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceiptsByClientId } from '../database/unitPaymentReceiptsDb';
import { spacing } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { db } from '../database/database';
import { generateAndShareCustomerLedgerPdf, RecordType } from '../utils/reportUtils';
import CustomerLedgerExportModal from '../components/CustomerLedgerExportModal';
import RecordTypeSelectionModal from '../components/RecordTypeSelectionModal';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'request' | 'receipt' | 'sales';
  amount: number;
  mode?: string;
  remarks?: string;
}



// Payment mode categories
const WHITE_PAYMENT_MODES = ['Cheque', 'Bank Transfer', 'UPI', 'Credit Card', 'Debit Card'];
const BLACK_PAYMENT_MODES = ['Cash', 'Other'];

const CustomerLedgerReportScreen = () => {
  const theme = useTheme();
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Record type selection state
  const [recordTypeModalVisible, setRecordTypeModalVisible] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('all');

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
          let receipts = await getUnitPaymentReceiptsByClientId(selectedClient.id!);

          // Filter receipts based on selected record type
          if (selectedRecordType === 'white') {
            receipts = receipts.filter(receipt =>
              !receipt.mode || WHITE_PAYMENT_MODES.includes(receipt.mode)
            );
          } else if (selectedRecordType === 'black') {
            receipts = receipts.filter(receipt =>
              receipt.mode && BLACK_PAYMENT_MODES.includes(receipt.mode)
            );
          }
          // For 'all', no filtering is applied

          let combinedData: LedgerEntry[] = [];

          if (selectedRecordType === 'all') {
            // For "All Records" - show Sales Value, B Value, payment requests and receipts
            const formattedRequests: LedgerEntry[] = requests.map(req => {
              const dateObj = new Date(req.date);
              const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;

              return {
                id: `req-${req.id ?? 0}`,
                date: formattedDate,
                description: `Payment Request: ${req.description || 'N/A'}`,
                type: 'request',
                amount: req.amount,
              };
            });

            const formattedReceipts: LedgerEntry[] = receipts.map(rec => {
              const dateObj = new Date(rec.date);
              const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;

              return {
                id: `rec-${rec.id ?? 0}`,
                date: formattedDate,
                description: `Payment Receipt: ${rec.description || 'N/A'}`,
                type: 'receipt',
                amount: rec.amount,
                mode: rec.mode,
                remarks: rec.remarks,
              };
            });

            // For "All Records" - don't add value entries to the ledger data, show them in footer only
            combinedData = [...formattedRequests, ...formattedReceipts].sort((a, b) => {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
          } else {
            // For "White Only" and "Black Only" - show new format with sales value and receipts only
            const formattedReceipts: LedgerEntry[] = receipts.map(rec => {
              const dateObj = new Date(rec.date);
              const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;

              return {
                id: `rec-${rec.id ?? 0}`,
                date: formattedDate,
                description: `Payment Receipt: ${rec.description || 'N/A'}`,
                type: 'receipt',
                amount: rec.amount,
                mode: rec.mode,
                remarks: rec.remarks,
              };
            });

            // Add Sales Value row at the beginning (without date) for white/black only
            const salesValueEntries: LedgerEntry[] = [];
            if (flatDetails) {
              let salesValue = flatDetails.flat_value || 0;
              let salesLabel = 'Flat Value';

              if (selectedRecordType === 'white' && flatDetails.w_value) {
                salesValue = flatDetails.w_value;
                salesLabel = 'Sales Value';
              } else if (selectedRecordType === 'black' && flatDetails.b_value) {
                salesValue = flatDetails.b_value;
                salesLabel = 'B Value';
              }

              if (salesValue > 0) {
                salesValueEntries.push({
                  id: 'sales-value',
                  date: '', // No date for sales value row
                  description: salesLabel,
                  type: 'sales',
                  amount: salesValue,
                });
              }
            }

            combinedData = [...salesValueEntries, ...formattedReceipts.sort((a, b) => {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            })];
          }

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
  }, [selectedClient, selectedRecordType]);

  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => setDialogVisible(false);

  const showRecordTypeModal = () => setRecordTypeModalVisible(true);
  const hideRecordTypeModal = () => setRecordTypeModalVisible(false);

  const showExportModal = () => setExportModalVisible(true);
  const hideExportModal = () => setExportModalVisible(false);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    hideDialog();
    // Reset record type to 'all' when selecting a new client
    setSelectedRecordType('all');
    // Show record type selection modal after client selection
    setTimeout(() => {
      showRecordTypeModal();
    }, 100);
  };

  const handleRecordTypeSelect = (recordType: RecordType) => {
    setSelectedRecordType(recordType);
    hideRecordTypeModal();
  };

  const handleExport = async (letterheadOption: 'none' | 'company', companyId?: number) => {
    hideExportModal();

    if (!selectedClient) {
      return;
    }

    try {
      console.log(`Exporting PDF with letterhead option: ${letterheadOption}, company ID: ${companyId}, record type: ${selectedRecordType}`);

      // Determine which flat value to use based on record type
      let flatValueToUse = clientFlatDetails?.flat_value;
      if (selectedRecordType === 'white' && clientFlatDetails?.w_value) {
        flatValueToUse = clientFlatDetails.w_value;
      } else if (selectedRecordType === 'black' && clientFlatDetails?.b_value) {
        flatValueToUse = clientFlatDetails.b_value;
      }

      // For "All Records", ledgerData already doesn't contain sales entries (they're shown in footer only)
      // For "White Only"/"Black Only", we need to filter out sales entries from PDF
      const pdfLedgerData = selectedRecordType === 'all'
        ? ledgerData // Already clean for "All Records"
        : ledgerData.filter(item => item.type !== 'sales'); // Remove Sales Value entries from PDF for white/black

      await generateAndShareCustomerLedgerPdf(
        selectedClient,
        pdfLedgerData,
        balanceAmount,
        totalAmountReceived,
        flatValueToUse,
        totalBalancePayable,
        companyId,
        letterheadOption,
        selectedRecordType
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
    if (selectedRecordType === 'all') {
      // Original calculation: receipts - requests (no sales entries in ledgerData for 'all')
      return ledgerData.reduce((total, item) => {
        return total + (item.type === 'receipt' ? item.amount : -item.amount);
      }, 0);
    } else {
      // New calculation for white/black: sales value - receipts
      return ledgerData.reduce((total, item) => {
        if (item.type === 'sales') {
          return total - item.amount; // Subtract sales value
        } else if (item.type === 'receipt') {
          return total + item.amount; // Add receipts
        }
        return total;
      }, 0);
    }
  }, [ledgerData, selectedRecordType]);

  // Calculate total amount received (sum of all payment receipts only)
  const totalAmountReceived = useMemo(() => {
    return ledgerData.reduce((total, item) => {
      return total + (item.type === 'receipt' ? item.amount : 0);
    }, 0);
  }, [ledgerData]);

  // Calculate total balance payable of flat value (Flat value - total amount received)
  const totalBalancePayable = useMemo(() => {
    let flatValue = clientFlatDetails?.flat_value || 0;

    // Use appropriate value based on record type
    if (selectedRecordType === 'white' && clientFlatDetails?.w_value) {
      flatValue = clientFlatDetails.w_value;
    } else if (selectedRecordType === 'black' && clientFlatDetails?.b_value) {
      flatValue = clientFlatDetails.b_value;
    }

    return flatValue - totalAmountReceived;
  }, [clientFlatDetails?.flat_value, clientFlatDetails?.w_value, clientFlatDetails?.b_value, totalAmountReceived, selectedRecordType]);

  const renderLedgerItem = ({ item }: { item: LedgerEntry }) => (
    <View style={styles.ledgerItem}>
      <View style={styles.ledgerMainRow}>
        {/* Don't show date for sales value row */}
        <Text style={styles.ledgerDate}>{item.type === 'sales' ? '' : item.date}</Text>
        <Text style={styles.ledgerDescription}>{item.description}</Text>
        <Text style={[
          styles.ledgerAmount,
          {
            color: item.type === 'sales' ? theme.colors.error :
                   item.type === 'receipt' ? theme.colors.primary :
                   theme.colors.error // for payment requests
          }
        ]}>
          {item.type === 'sales' ? '- ' :
           item.type === 'receipt' ? '+ ' :
           '- '}₹{item.amount.toFixed(2)}
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

    // Determine which flat value to display based on record type
    let flatValueToDisplay = clientFlatDetails.flat_value || 0;
    let flatValueLabel = 'Flat Value:';

    if (selectedRecordType === 'white' && clientFlatDetails.w_value) {
      flatValueToDisplay = clientFlatDetails.w_value;
      flatValueLabel = 'Sales Value:'; // Changed from 'W Value:' to 'Sales Value:'
    } else if (selectedRecordType === 'black' && clientFlatDetails.b_value) {
      flatValueToDisplay = clientFlatDetails.b_value;
      flatValueLabel = 'B Value:';
    }

    return (
      <View style={styles.flatValueContainer}>
        <Text style={[styles.flatValueLabel, { color: theme.colors.onSurface }]}>
          {flatValueLabel}
        </Text>
        <Text style={[styles.flatValueAmount, { color: theme.colors.primary }]}>
          {formatCurrency(flatValueToDisplay)}
        </Text>
        <Divider style={styles.divider} />
      </View>
    );
  };

  const renderFooter = () => {
    if (ledgerData.length === 0) return null;

    if (selectedRecordType === 'all') {
      // Enhanced footer for "All Records" with Sales Value and B Value information
      // Calculate white receipts total (for Sales Value balance)
      const whiteReceiptsTotal = ledgerData.reduce((total, item) => {
        if (item.type === 'receipt' && item.mode && WHITE_PAYMENT_MODES.includes(item.mode)) {
          return total + item.amount;
        }
        return total;
      }, 0);

      // Calculate black receipts total (for B Value balance)
      const blackReceiptsTotal = ledgerData.reduce((total, item) => {
        if (item.type === 'receipt' && item.mode && BLACK_PAYMENT_MODES.includes(item.mode)) {
          return total + item.amount;
        }
        return total;
      }, 0);

      const salesValueBalance = clientFlatDetails?.w_value ? (clientFlatDetails.w_value - whiteReceiptsTotal) : 0;
      const bValueBalance = clientFlatDetails?.b_value ? (clientFlatDetails.b_value - blackReceiptsTotal) : 0;

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

          {/* Display Sales Value and B Value information below Total Balance Payable of Flat Value */}
          {clientFlatDetails?.w_value && clientFlatDetails.w_value > 0 && (
            <>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Sales Value:</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: theme.colors.error } // Red color with negative sign
                ]}>
                  - {formatCurrency(clientFlatDetails.w_value)}
                </Text>
              </View>
              <View style={styles.balanceRowMultiLine}>
                <Text style={styles.balanceLabelMultiLine}>Total Balance Payable{'\n'}of Sales Value:</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: salesValueBalance >= 0 ? theme.colors.primary : theme.colors.error }
                ]}>
                  {formatCurrency(salesValueBalance)}
                </Text>
              </View>
            </>
          )}

          {clientFlatDetails?.b_value && clientFlatDetails.b_value > 0 && (
            <>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>B Value:</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: theme.colors.error } // Red color with negative sign
                ]}>
                  - {formatCurrency(clientFlatDetails.b_value)}
                </Text>
              </View>
              <View style={styles.balanceRowMultiLine}>
                <Text style={styles.balanceLabelMultiLine}>Total Balance Payable{'\n'}of B Value:</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: bValueBalance >= 0 ? theme.colors.primary : theme.colors.error }
                ]}>
                  {formatCurrency(bValueBalance)}
                </Text>
              </View>
            </>
          )}
        </View>
      );
    } else {
      // New footer for "White Only" and "Black Only"
      const balancePayableLabel = selectedRecordType === 'white'
        ? 'Total Balance Payable\nof Sales Value:'
        : 'Total Balance Payable\nof B Value:'; // Changed from "Flat Value" to "B Value"

      return (
        <View style={styles.balanceContainer}>
          <Divider style={styles.divider} />
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Total Amount Received:</Text>
            <Text style={[
              styles.balanceAmount,
              { color: '#4CAF50' } // Green color as requested
            ]}>
              {formatCurrency(totalAmountReceived)}
            </Text>
          </View>
          <View style={styles.balanceRowMultiLine}>
            <Text style={styles.balanceLabelMultiLine}>{balancePayableLabel}</Text>
            <Text style={[
              styles.balanceAmount,
              { color: totalBalancePayable >= 0 ? theme.colors.primary : theme.colors.error }
            ]}>
              {formatCurrency(totalBalancePayable)}
            </Text>
          </View>
        </View>
      );
    }
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
            mode="outlined"
            onPress={showRecordTypeModal}
            icon="filter-variant"
            style={styles.recordTypeButton}
          >
            {selectedRecordType === 'all' ? 'All Records' :
             selectedRecordType === 'white' ? 'White Only' : 'Black Only'}
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
                  onPress={() => handleClientSelect(item)}
                />
              )}
              ListEmptyComponent={<Text>No clients found.</Text>}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Record Type Selection Modal */}
        <RecordTypeSelectionModal
          visible={recordTypeModalVisible}
          onDismiss={hideRecordTypeModal}
          onSelect={handleRecordTypeSelect}
          selectedRecordType={selectedRecordType}
        />

        {/* Customer Ledger Export Modal */}
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
  recordTypeButton: {
    marginLeft: spacing.sm,
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
