import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Searchbar, FAB, useTheme, Text, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { RootStackParamList, DrawerParamList } from '../types';
import { Lead } from '../types';
import { getLeads, deleteLead } from '../database';
import { LeadCard, LoadingIndicator, EmptyState, StatusBadge } from '../components';
import { spacing, shadows, animations } from '../constants/theme';

type LeadsScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'Leads'>,
  StackNavigationProp<RootStackParamList>
>;

const LeadsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<LeadsScreenNavigationProp>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load leads function
  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await getLeads();
      setLeads(data);
      setFilteredLeads(searchQuery ?
        data.filter(lead =>
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lead.enquiry_for && lead.enquiry_for.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (lead.lead_source && lead.lead_source.toLowerCase().includes(searchQuery.toLowerCase())) ||
          lead.status.toLowerCase().includes(searchQuery.toLowerCase())
        ) : data);
    } catch (error) {
      console.error('Error loading leads:', error);
      Alert.alert('Error', 'Failed to load leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeads();
  }, [searchQuery]);

  // Load leads when the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadLeads();
    }, [])
  );

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredLeads(leads);
    } else {
      const filtered = leads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query.toLowerCase()) ||
          (lead.enquiry_for && lead.enquiry_for.toLowerCase().includes(query.toLowerCase())) ||
          (lead.lead_source && lead.lead_source.toLowerCase().includes(query.toLowerCase())) ||
          lead.status.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLeads(filtered);
    }
  };

  // Handle delete lead
  const handleDeleteLead = (leadId: number) => {
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
              setLeads(leads.filter((lead) => lead.id !== leadId));
              setFilteredLeads(filteredLeads.filter((lead) => lead.id !== leadId));
            } catch (error) {
              console.error('Error deleting lead:', error);
              Alert.alert('Error', 'Failed to delete lead');
            }
          },
        },
      ]
    );
  };

  // Group leads by status
  const groupedLeads = useCallback(() => {
    const groups: { [key: string]: Lead[] } = {};

    filteredLeads.forEach(lead => {
      if (!groups[lead.status]) {
        groups[lead.status] = [];
      }
      groups[lead.status].push(lead);
    });

    // Sort by status priority
    const statusOrder = ['Lead', 'Contacted', 'Quote Given', 'Converted'];
    return Object.keys(groups)
      .sort((a, b) => statusOrder.indexOf(a) - statusOrder.indexOf(b))
      .map(status => ({
        status,
        data: groups[status]
      }));
  }, [filteredLeads]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ flex: 1 }}>
        {/* Search Bar with improved styling */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search leads..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
            iconColor={theme.colors.onSurfaceVariant}
            inputStyle={{ color: theme.colors.onSurface }}
          />
        </View>

        {loading ? (
          <LoadingIndicator />
        ) : filteredLeads.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(animations.duration.entrance)}>
            <EmptyState
              icon="account-convert"
              title="No Leads"
              message={searchQuery ? "No leads match your search" : "You haven't added any leads yet"}
              buttonText={searchQuery ? undefined : "Add Lead"}
              onButtonPress={searchQuery ? undefined : () => navigation.navigate('AddLead')}
            />
          </Animated.View>
        ) : (
          <FlatList
            data={groupedLeads()}
            keyExtractor={(item) => item.status}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInRight.delay(index * 100).duration(300)}
                style={styles.sectionContainer}
              >
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <StatusBadge status={item.status} size="medium" showIcon={true} />
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {item.data.length} {item.data.length === 1 ? 'Lead' : 'Leads'}
                    </Text>
                  </View>
                </View>
                <Divider style={styles.sectionDivider} />

                {/* Section Content */}
                <FlatList
                  data={item.data}
                  keyExtractor={(lead) => lead.id?.toString() || Math.random().toString()}
                  renderItem={({ item: lead, index: leadIndex }) => (
                    <LeadCard
                      lead={lead}
                      index={leadIndex}
                      onPress={(lead) => navigation.navigate('LeadDetails', { leadId: lead.id! })}
                      onEdit={(lead) => navigation.navigate('EditLead', { lead })}
                      onDelete={(leadId) => handleDeleteLead(leadId)}
                    />
                  )}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                />
              </Animated.View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
                progressBackgroundColor={theme.colors.surface}
              />
            }
          />
        )}
      </View>

      <FAB
        icon="plus"
        style={[styles.fab, shadows.lg, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddLead')}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 12,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100, // Extra padding at bottom for FAB
  },
  sectionContainer: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  sectionDivider: {
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});

export default LeadsScreen;
