import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ActivityIndicator, Button, Dialog, Portal, List, Searchbar, Divider, FAB, IconButton } from 'react-native-paper';
import { Client, Company } from '../types';
import { getClientsWithDetails, ClientWithDetails } from '../database/clientsDb';
import { getUnitPaymentRequestsByClientId } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceiptsByClientId } from '../database/unitPaymentReceiptsDb';
import { UnitPaymentRequest, UnitPaymentReceipt } from '../types';
import { spacing } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';
import { generateAndShareCustomerLedgerPdf } from '../utils/reportUtils';
import { CompanySelectionModal } from '../components';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'request' | 'receipt';
  amount: number;
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
  const [companySelectionVisible, setCompanySelectionVisible] = useState(false);

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

  const showCompanySelection = () => setCompanySelectionVisible(true);
  const hideCompanySelection = () => setCompanySelectionVisible(false);

  const handleCompanySelect = async (companyId: number) => {
    hideCompanySelection();

    if (!selectedClient) {
      return;
    }

    try {
      console.log(`Exporting PDF with company ID: ${companyId}`);
      await generateAndShareCustomerLedgerPdf(
        selectedClient,
        ledgerData,
        balanceAmount,
        companyId // Use the companyId parameter directly
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

  const renderLedgerItem = ({ item }: { item: LedgerEntry }) => (
    <View style={styles.ledgerItem}>
      <Text style={styles.ledgerDate}>{item.date}</Text>
      <Text style={styles.ledgerDescription}>{item.description}</Text>
      <Text style={[styles.ledgerAmount, { color: item.type === 'receipt' ? theme.colors.primary : theme.colors.error }]}>
        {item.type === 'receipt' ? '+' : '-'} ₹{item.amount.toFixed(2)}
      </Text>
    </View>
  );

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
            onPress={showCompanySelection}
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

        {/* Company Selection Modal for PDF Export */}
        <CompanySelectionModal
          visible={companySelectionVisible}
          onDismiss={hideCompanySelection}
          onSelect={handleCompanySelect}
          title="Select Company for Letterhead"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  },
});

export default CustomerLedgerReportScreen;
