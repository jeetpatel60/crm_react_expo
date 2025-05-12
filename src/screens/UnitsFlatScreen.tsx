import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Searchbar, FAB, useTheme, SegmentedButtons } from 'react-native-paper';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RootStackParamList, DrawerParamList } from '../types';
import { UnitFlat, UnitStatus } from '../database/unitsFlatDb';
import { Project } from '../types';
import { getUnitsFlats, deleteUnitFlat } from '../database/unitsFlatDb';
import { generateAndShareDocxDocument } from '../utils/docxUtils';
import { getProjects } from '../database/projectsDb';
import { UnitFlatCard, LoadingIndicator, EmptyState, AgreementTemplateSelectionModal } from '../components';
import { spacing, shadows, animations } from '../constants/theme';
import { UNIT_STATUS_OPTIONS } from '../constants';

type UnitsFlatScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'UnitsFlats'>,
  StackNavigationProp<RootStackParamList>
>;

const ALL_UNIT_STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  ...UNIT_STATUS_OPTIONS,
];

const UnitsFlatScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<UnitsFlatScreenNavigationProp>();

  const [units, setUnits] = useState<UnitFlat[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitFlat[]>([]);
  const [projects, setProjects] = useState<Map<number, Project>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitFlat | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Fetch units/flats
      const unitsData = await getUnitsFlats();
      setUnits(unitsData);

      // Fetch projects for reference
      const projectsData = await getProjects();
      const projectsMap = new Map<number, Project>();
      projectsData.forEach(project => {
        projectsMap.set(project.id!, project);
      });
      setProjects(projectsMap);

      // Apply filters
      let filtered = unitsData;

      if (searchQuery) {
        filtered = filtered.filter(unit =>
          unit.flat_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          unit.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          projectsMap.get(unit.project_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(unit => unit.status === statusFilter);
      }

      setFilteredUnits(filtered);
    } catch (error) {
      console.error('Error loading units/flats:', error);
      Alert.alert('Error', 'Failed to load units/flats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter]);

  // Load data on initial render and when the screen comes into focus
  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDeleteUnitFlat = (unitId: number) => {
    Alert.alert(
      'Delete Unit/Flat',
      'Are you sure you want to delete this unit/flat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUnitFlat(unitId);
              Alert.alert('Success', 'Unit/Flat deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting unit/flat:', error);
              Alert.alert('Error', 'Failed to delete unit/flat');
            }
          },
        },
      ]
    );
  };

  const handleExportAgreement = (unit: UnitFlat) => {
    setSelectedUnit(unit);
    setTemplateModalVisible(true);
  };

  const handleTemplateSelect = async (templateId: number) => {
    setTemplateModalVisible(false);

    if (selectedUnit) {
      try {
        const project = projects.get(selectedUnit.project_id);

        if (!project) {
          Alert.alert('Error', 'Project information not found');
          return;
        }

        // Use the project's company_id for the letterhead
        await generateAndShareDocxDocument(
          templateId,
          selectedUnit.id,
          undefined,
          project.id,
          project.company_id
        );
      } catch (error) {
        console.error('Error exporting agreement:', error);
        Alert.alert('Error', 'Failed to export agreement');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.searchContainer, shadows.sm]}
      >
        <Searchbar
          placeholder="Search units/flats..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          clearButtonMode="while-editing"
        />
      </Animated.View>

      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={ALL_UNIT_STATUS_OPTIONS.map(option => ({
          value: option.value,
          label: option.label,
        }))}
        style={styles.segmentedButtons}
      />

      {loading ? (
        <LoadingIndicator />
      ) : filteredUnits.length === 0 ? (
        <EmptyState
          icon="home-city"
          title="No Units/Flats"
          message={searchQuery || statusFilter !== 'all' ? "No units/flats match your search" : "You haven't added any units/flats yet"}
          buttonText={searchQuery || statusFilter !== 'all' ? undefined : "Add Unit/Flat"}
          onButtonPress={searchQuery || statusFilter !== 'all' ? undefined : () => navigation.navigate('AddUnitFlat')}
        />
      ) : (
        <FlatList
          data={filteredUnits}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item, index }) => {
            const project = projects.get(item.project_id);
            return (
              <UnitFlatCard
                unit={item}
                project={project}
                onPress={(unit) => navigation.navigate('UnitFlatDetails', { unitId: unit.id! })}
                onEdit={(unit) => navigation.navigate('EditUnitFlat', { unit })}
                onDelete={(unitId) => handleDeleteUnitFlat(unitId)}
                onExport={handleExportAgreement}
                index={index}
              />
            );
          }}
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
        onPress={() => navigation.navigate('AddUnitFlat')}
      />

      {/* Agreement Template Selection Modal */}
      <AgreementTemplateSelectionModal
        visible={templateModalVisible}
        onDismiss={() => setTemplateModalVisible(false)}
        onSelect={handleTemplateSelect}
        title="Select Agreement Template"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchbar: {
    borderRadius: 8,
  },
  segmentedButtons: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
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

export default UnitsFlatScreen;
