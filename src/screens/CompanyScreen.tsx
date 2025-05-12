import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Searchbar, FAB, useTheme, Card, Text, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerNavigationProp } from '@react-navigation/drawer';

import { RootStackParamList, DrawerParamList } from '../types';
import { Company } from '../database/companiesDb';
import { getCompanies, deleteCompany } from '../database';
import { LoadingIndicator, EmptyState } from '../components';
import { spacing } from '../constants/theme';
import { shadows } from '../constants/theme';

type CompanyScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'Company'>,
  StackNavigationProp<RootStackParamList>
>;

const CompanyScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<CompanyScreenNavigationProp>();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);

      // Apply search filter if needed
      if (searchQuery.trim() === '') {
        setFilteredCompanies(data);
      } else {
        const filtered = data.filter(company =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCompanies(filtered);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCompanies();
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadCompanies();
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  };

  const handleDeleteCompany = (companyId: number) => {
    Alert.alert(
      'Delete Company',
      'Are you sure you want to delete this company? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCompany(companyId);
              loadCompanies();
              Alert.alert('Success', 'Company deleted successfully');
            } catch (error) {
              console.error('Error deleting company:', error);
              Alert.alert('Error', 'Failed to delete company. Please try again.');
            }
          },
        },
      ]
    );
  };

  const CompanyCard = ({ company, onPress, onEdit, onDelete }: {
    company: Company;
    onPress: (company: Company) => void;
    onEdit?: (company: Company) => void;
    onDelete?: (companyId: number) => void;
  }) => {
    // Define gradient colors for a stronger diagonal effect
    const gradientColors = [
      theme.colors.surface,
      theme.dark ? theme.colors.background : theme.colors.outline // Use background (dark) or outline (light) for stronger contrast
    ] as any; // Explicitly cast to any to resolve TypeScript error

    return (
      <Card
        style={[styles.companyCard, shadows.lg]} // Use softer shadow (sm)
        onPress={() => onPress(company)}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }} // Diagonal start
          end={{ x: 1, y: 1 }}   // Diagonal end
          style={[styles.gradientContainer, { borderRadius: theme.roundness }]} // Apply borderRadius
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardDetails}>
              <Text variant="titleMedium" style={styles.companyName}>
              {company.name}
            </Text>
            {company.salutation && (
              <Text
                variant="bodySmall"
                style={[styles.salutation, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {company.salutation.substring(0, 50)}
                {company.salutation.length > 50 ? '...' : ''}
              </Text>
            )}
          </View>
          <View style={styles.cardActions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.secondary}
                onPress={() => onEdit(company)}
              />
            )}
            {onDelete && company.id && (
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => onDelete(company.id!)}
              />
            )}
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search companies..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.onSurface }}
      />

      {filteredCompanies.length === 0 ? (
        <EmptyState
          icon="office-building"
          title="No Companies"
          message={searchQuery ? "No companies match your search" : "You haven't added any companies yet"}
          buttonText={searchQuery ? undefined : "Add Company"}
          onButtonPress={searchQuery ? undefined : () => navigation.navigate('AddCompany')}
        />
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <CompanyCard
              company={item}
              onPress={(company) => navigation.navigate('CompanyDetails', { companyId: company.id! })}
              onEdit={(company) => navigation.navigate('EditCompany', { company })}
              onDelete={(companyId) => handleDeleteCompany(companyId)}
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
        onPress={() => navigation.navigate('AddCompany')}
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
    elevation: 2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80, // Extra padding for FAB
  },
  companyCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
  },
  companyName: {
    fontWeight: '600',
  },
  salutation: {
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  gradientContainer: {
    flex: 1,
  },
});

export default CompanyScreen;
