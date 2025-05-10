import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, useTheme, Divider, IconButton } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Client } from '../types';
import { getClientById, deleteClient } from '../database';
import { LoadingIndicator } from '../components';
import { spacing, shadows } from '../constants/theme';

type ClientDetailsRouteProp = RouteProp<RootStackParamList, 'ClientDetails'>;
type ClientDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const ClientDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<ClientDetailsRouteProp>();
  const navigation = useNavigation<ClientDetailsNavigationProp>();
  const { clientId } = route.params;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const clientData = await getClientById(clientId);
        setClient(clientData);
      } catch (error) {
        console.error('Error loading client:', error);
        Alert.alert('Error', 'Failed to load client details. Please try again.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [clientId, navigation]);

  const handleEdit = () => {
    if (client) {
      navigation.navigate('EditClient', { client });
    }
  };

  const handleDelete = () => {
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
              Alert.alert('Success', 'Client deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('Error', 'Failed to delete client. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!client) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Client not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.clientCard, shadows.md, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.clientHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text variant="headlineSmall" style={styles.name}>
                  {client.name}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="pencil"
                  size={24}
                  iconColor={theme.colors.secondary}
                  onPress={handleEdit}
                />
                <IconButton
                  icon="delete"
                  size={24}
                  iconColor={theme.colors.error}
                  onPress={handleDelete}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.clientDetails}>
              {client.email && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">{client.email}</Text>
                </View>
              )}
              
              {client.contact_no && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">{client.contact_no}</Text>
                </View>
              )}
              
              {client.pan_no && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">PAN: {client.pan_no}</Text>
                </View>
              )}
              
              {client.gstin_no && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">GSTIN: {client.gstin_no}</Text>
                </View>
              )}
              
              {client.address && (
                <View style={styles.addressContainer}>
                  <Text variant="titleMedium" style={styles.addressTitle}>
                    Address
                  </Text>
                  <Text variant="bodyMedium" style={styles.address}>
                    {client.address}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  clientCard: {
    borderRadius: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  clientInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  name: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.md,
  },
  clientDetails: {
    marginTop: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailIcon: {
    marginRight: spacing.md,
  },
  addressContainer: {
    marginTop: spacing.md,
  },
  addressTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  address: {
    lineHeight: 22,
  },
});

export default ClientDetailsScreen;
