import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { Client } from '../database/clientsDb';
import { getClients } from '../database/clientsDb';
import { spacing, shadows, borderRadius } from '../constants/theme';

interface ClientSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (clientId: number, clientName: string) => void;
  title?: string;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({
  visible,
  onDismiss,
  onSelect,
  title = 'Select Client',
}) => {
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadClients();
    }
  }, [visible]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        
        <RNTextInput
          style={[
            styles.searchInput,
            { 
              backgroundColor: theme.colors.background,
              color: theme.colors.onBackground,
              borderColor: theme.colors.outline
            }
          ]}
          placeholder="Search clients..."
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : (
          <ScrollView style={styles.modalScrollView}>
            {filteredClients.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceDisabled }]}>
                No clients found
              </Text>
            ) : (
              filteredClients.map((client) => (
                <Button
                  key={client.id}
                  mode="text"
                  onPress={() => {
                    onSelect(client.id!, client.name);
                    onDismiss();
                  }}
                  style={styles.clientButton}
                >
                  {client.name}
                </Button>
              ))
            )}
          </ScrollView>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={[styles.button, { borderColor: theme.colors.outline }]}
          >
            Cancel
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  modalScrollView: {
    marginVertical: spacing.md,
    maxHeight: 300,
  },
  clientButton: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  button: {
    minWidth: 120,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
});

export default ClientSelectionModal;
