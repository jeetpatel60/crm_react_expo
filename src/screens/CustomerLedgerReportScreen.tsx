import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ActivityIndicator, Button, Dialog, Portal, List, Searchbar } from 'react-native-paper';
import { Client } from '../types';
import { getClients } from '../database/clientsDb';
import { getUnitPaymentRequestsByClientId } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceiptsByClientId } from '../database/unitPaymentReceiptsDb';
import { UnitPaymentRequest, UnitPaymentReceipt } from '../types';
import { spacing } from '../constants/theme';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'request' | 'receipt';
  amount: number;
}

const CustomerLedgerReportScreen = () => {
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadClients = async () => {
      try {
        const fetchedClients = await getClients();
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLedgerItem = ({ item }: { item: LedgerEntry }) => (
    <View style={styles.ledgerItem}>
      <Text style={styles.ledgerDate}>{item.date}</Text>
      <Text style={styles.ledgerDescription}>{item.description}</Text>
      <Text style={[styles.ledgerAmount, { color: item.type === 'receipt' ? theme.colors.primary : theme.colors.error }]}>
        {item.type === 'receipt' ? '+' : '-'} ₹{item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Button mode="outlined" onPress={showDialog} style={styles.selectClientButton}>
        {selectedClient ? `Selected Client: ${selectedClient.name}` : 'Select Client'}
      </Button>

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
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  selectClientButton: {
    marginBottom: spacing.md,
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
});

export default CustomerLedgerReportScreen;
