import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, FAB, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList } from '../types';
import { Lead } from '../types';
import { getLeads, deleteLead } from '../database';
import { LeadCard, LoadingIndicator, EmptyState } from '../components';
import { spacing, shadows, animations } from '../constants/theme';

type LeadsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const LeadsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<LeadsScreenNavigationProp>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load leads when the screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadLeads = async () => {
        try {
          setLoading(true);
          const data = await getLeads();
          setLeads(data);
          setFilteredLeads(data);
        } catch (error) {
          console.error('Error loading leads:', error);
          Alert.alert('Error', 'Failed to load leads');
        } finally {
          setLoading(false);
        }
      };

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ flex: 1 }}>
        <Searchbar
          placeholder="Search leads..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          iconColor={theme.colors.onSurfaceVariant}
          inputStyle={{ color: theme.colors.onSurface }}
        />

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
          <Animated.FlatList
            data={filteredLeads}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item, index }) => (
              <LeadCard
                lead={item}
                index={index}
                onPress={(lead) => navigation.navigate('LeadDetails', { leadId: lead.id! })}
                onEdit={(lead) => navigation.navigate('EditLead', { lead })}
                onDelete={(leadId) => handleDeleteLead(leadId)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  searchBar: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    elevation: 0,
    borderRadius: 12,
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

export default LeadsScreen;
