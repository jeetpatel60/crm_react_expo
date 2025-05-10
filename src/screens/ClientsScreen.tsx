import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, FAB, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList } from '../types';
import { Client } from '../types';
import { getClients, deleteClient } from '../database';
import { ClientCard, LoadingIndicator, EmptyState } from '../components';
import { spacing, shadows, animations } from '../constants/theme';

type ClientsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ClientsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ClientsScreenNavigationProp>();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await getClients();
      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(query.toLowerCase()) ||
          (client.email && client.email.toLowerCase().includes(query.toLowerCase())) ||
          (client.gstin_no && client.gstin_no.toLowerCase().includes(query.toLowerCase())) ||
          (client.pan_no && client.pan_no.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  };

  const handleDeleteClient = (clientId: number) => {
    Alert.alert(
      'Delete Client',
      'Are you sure you want to delete this client? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(clientId);
              loadClients();
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('Error', 'Failed to delete client. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View entering={FadeInDown.duration(animations.duration.standard)}>
        <Searchbar
          placeholder="Search clients..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[
            styles.searchBar,
            shadows.md,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
            }
          ]}
          iconColor={theme.colors.primary}
          inputStyle={{ color: theme.colors.onSurface }}
        />
      </Animated.View>

      {loading ? (
        <LoadingIndicator />
      ) : filteredClients.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(animations.duration.entrance)}>
          <EmptyState
            icon="account-tie"
            title="No Clients"
            message={searchQuery ? "No clients match your search" : "You haven't added any clients yet"}
            buttonText={searchQuery ? undefined : "Add Client"}
            onButtonPress={searchQuery ? undefined : () => navigation.navigate('AddClient')}
          />
        </Animated.View>
      ) : (
        <Animated.FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item, index }) => (
            <ClientCard
              client={item}
              index={index}
              onPress={(client) => navigation.navigate('ClientDetails', { clientId: client.id! })}
              onEdit={(client) => navigation.navigate('EditClient', { client })}
              onDelete={(clientId) => handleDeleteClient(clientId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Animated.View
        entering={FadeInDown.delay(300).duration(animations.duration.standard)}
      >
        <FAB
          icon="plus"
          style={[styles.fab, shadows.lg, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('AddClient')}
          color="#fff"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100, // Extra padding at bottom for FAB
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});

export default ClientsScreen;
