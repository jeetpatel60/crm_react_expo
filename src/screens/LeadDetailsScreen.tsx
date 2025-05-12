import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, useTheme, Divider, IconButton } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Lead } from '../types';
import { getLeadById, deleteLead } from '../database';
import { LoadingIndicator, StatusChip } from '../components';
import { spacing, shadows } from '../constants/theme';

type LeadDetailsScreenRouteProp = RouteProp<RootStackParamList, 'LeadDetails'>;
type LeadDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const LeadDetailsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<LeadDetailsScreenNavigationProp>();
  const route = useRoute<LeadDetailsScreenRouteProp>();
  const { leadId } = route.params;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLead = async () => {
      try {
        setLoading(true);
        const data = await getLeadById(leadId);
        setLead(data);
      } catch (error) {
        console.error('Error loading lead:', error);
        Alert.alert('Error', 'Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };

    loadLead();
  }, [leadId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLead(leadId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting lead:', error);
              Alert.alert('Error', 'Failed to delete lead');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (lead) {
      navigation.navigate('EditLead', { lead });
    }
  };



  // Format budget as currency
  const formatBudget = (budget?: number) => {
    if (!budget) return 'Not specified';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(budget);
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!lead) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Lead not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.leadCard, shadows.md, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.leadHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {lead.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </Text>
              </View>
              <View style={styles.leadInfo}>
                <Text variant="headlineSmall" style={styles.name}>
                  {lead.name}
                </Text>
                <StatusChip status={lead.status} size="medium" />
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

            <View style={styles.leadDetails}>
              {lead.enquiry_for && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">Enquiry For: {lead.enquiry_for}</Text>
                </View>
              )}

              {lead.budget && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="currency-inr"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">Budget: {formatBudget(lead.budget)}</Text>
                </View>
              )}

              {lead.reference && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="account-arrow-right-outline"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">Reference: {lead.reference}</Text>
                </View>
              )}

              {lead.lead_source && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="source-branch"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.detailIcon}
                  />
                  <Text variant="bodyLarge">Source: {lead.lead_source}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="phone"
                onPress={() => {
                  // This would handle calling the lead in a real app
                  Alert.alert('Call Lead', 'This would call the lead in a real app');
                }}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              >
                Call Lead
              </Button>
              <Button
                mode="contained"
                icon="email"
                onPress={() => {
                  // This would handle emailing the lead in a real app
                  Alert.alert('Email Lead', 'This would email the lead in a real app');
                }}
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
              >
                Email
              </Button>
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
  leadCard: {
    borderRadius: 12,
  },
  leadHeader: {
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
  leadInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  name: {
    fontWeight: 'bold',
  },
  statusChip: {
    alignSelf: 'flex-start',
    height: 28,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginVertical: spacing.md,
  },
  leadDetails: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default LeadDetailsScreen;
