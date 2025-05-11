import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Searchbar, FAB, useTheme } from 'react-native-paper';
import { useNavigation, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList, DrawerParamList, Quotation } from '../types';
import { getQuotations, deleteQuotation } from '../database';
import { getProjectById } from '../database/projectsDb';
import { getLeadById } from '../database/leadsDb';
import { getUnitFlatById } from '../database/unitsFlatDb';
import { getCompanyById } from '../database/companiesDb';
import { QuotationCard, LoadingIndicator, EmptyState } from '../components';
import { spacing, shadows, animations } from '../constants/theme';

type QuotationScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'Quotation'>,
  StackNavigationProp<RootStackParamList>
>;

const QuotationScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<QuotationScreenNavigationProp>();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotationDetails, setQuotationDetails] = useState<{
    [key: number]: {
      projectName?: string;
      leadName?: string;
      flatNo?: string;
      companyName?: string;
    };
  }>({});

  const fetchQuotations = async () => {
    try {
      const data = await getQuotations();
      setQuotations(data);
      setFilteredQuotations(data);

      // Fetch related details for each quotation
      const details: { [key: number]: any } = {};
      for (const quotation of data) {
        if (!quotation.id) continue;

        details[quotation.id] = {};

        if (quotation.project_id) {
          const project = await getProjectById(quotation.project_id);
          if (project) {
            details[quotation.id].projectName = project.name;
          }
        }

        if (quotation.lead_id) {
          const lead = await getLeadById(quotation.lead_id);
          if (lead) {
            details[quotation.id].leadName = lead.name;
          }
        }

        if (quotation.flat_id) {
          const flat = await getUnitFlatById(quotation.flat_id);
          if (flat) {
            details[quotation.id].flatNo = flat.flat_no;
          }
        }

        if (quotation.company_id) {
          const company = await getCompanyById(quotation.company_id);
          if (company) {
            details[quotation.id].companyName = company.name;
          }
        }
      }

      setQuotationDetails(details);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      Alert.alert('Error', 'Failed to load quotations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQuotations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotations();
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredQuotations(quotations);
    } else {
      const filtered = quotations.filter(
        (quotation) =>
          quotation.quotation_no.toLowerCase().includes(query.toLowerCase()) ||
          (quotationDetails[quotation.id!]?.projectName &&
            quotationDetails[quotation.id!].projectName.toLowerCase().includes(query.toLowerCase())) ||
          (quotationDetails[quotation.id!]?.leadName &&
            quotationDetails[quotation.id!].leadName.toLowerCase().includes(query.toLowerCase())) ||
          (quotationDetails[quotation.id!]?.flatNo &&
            quotationDetails[quotation.id!].flatNo.toLowerCase().includes(query.toLowerCase())) ||
          (quotationDetails[quotation.id!]?.companyName &&
            quotationDetails[quotation.id!].companyName.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredQuotations(filtered);
    }
  };

  const handleDeleteQuotation = (quotationId: number) => {
    Alert.alert(
      'Delete Quotation',
      'Are you sure you want to delete this quotation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuotation(quotationId);
              setQuotations(quotations.filter((q) => q.id !== quotationId));
              setFilteredQuotations(filteredQuotations.filter((q) => q.id !== quotationId));
            } catch (error) {
              console.error('Error deleting quotation:', error);
              Alert.alert('Error', 'Failed to delete quotation');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.searchContainer, shadows.sm]}
      >
        <Searchbar
          placeholder="Search quotations..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          clearButtonMode="while-editing"
        />
      </Animated.View>

      {loading ? (
        <LoadingIndicator />
      ) : filteredQuotations.length === 0 ? (
        <EmptyState
          icon="file-document"
          title="No Quotations"
          message={searchQuery ? "No quotations match your search" : "You haven't added any quotations yet"}
          buttonText={searchQuery ? undefined : "Add Quotation"}
          onButtonPress={searchQuery ? undefined : () => navigation.navigate('AddQuotation')}
        />
      ) : (
        <FlatList
          data={filteredQuotations}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item, index }) => (
            <QuotationCard
              quotation={item}
              projectName={item.id ? quotationDetails[item.id]?.projectName : undefined}
              leadName={item.id ? quotationDetails[item.id]?.leadName : undefined}
              flatNo={item.id ? quotationDetails[item.id]?.flatNo : undefined}
              companyName={item.id ? quotationDetails[item.id]?.companyName : undefined}
              onPress={(quotation) => navigation.navigate('QuotationDetails', { quotationId: quotation.id! })}
              onEdit={(quotation) => navigation.navigate('EditQuotation', { quotation })}
              onDelete={(quotationId) => handleDeleteQuotation(quotationId)}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
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

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('AddQuotation')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  searchbar: {
    elevation: 0,
    borderRadius: 8,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
});

export default QuotationScreen;
