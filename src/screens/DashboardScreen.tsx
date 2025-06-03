import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { LoadingIndicator, KPICard, ChartCard } from '../components';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { fetchDashboardData, DashboardData, generateUnitsByStatusData, generateUnitsSoldWeeklyData, generateUnitsSoldMonthlyData } from '../utils/dashboardUtils';
import { getUnitsFlats, UnitFlat } from '../database/unitsFlatDb';
import { formatCurrency } from '../utils/formatters';

const DashboardScreen = () => {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [unitsData, setUnitsData] = useState<UnitFlat[]>([]);

  // State for project filtering
  const [selectedWeeklyProjectId, setSelectedWeeklyProjectId] = useState<number | null>(null);
  const [selectedMonthlyProjectId, setSelectedMonthlyProjectId] = useState<number | null>(null);
  const [selectedUnitsStatusProjectId, setSelectedUnitsStatusProjectId] = useState<number | null>(null);

  // State for filtered chart data
  const [filteredWeeklyData, setFilteredWeeklyData] = useState<{ x: string; y: number }[]>([]);
  const [filteredMonthlyData, setFilteredMonthlyData] = useState<{ x: string; y: number }[]>([]);
  const [filteredUnitsStatusData, setFilteredUnitsStatusData] = useState<{ x: string; y: number; label?: string }[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardData();
      const units = await getUnitsFlats();

      setDashboardData(data);
      setUnitsData(units);

      // Initialize filtered data
      setFilteredWeeklyData(data.unitsSoldPast6Weeks);
      setFilteredMonthlyData(data.unitsSoldPast6Months);
      setFilteredUnitsStatusData(data.unitsByStatus);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // Update filtered data when project selection or dashboard data changes
  useEffect(() => {
    if (!dashboardData || unitsData.length === 0) return;

    // Filter weekly data by project using actual units data
    const weeklyData = generateUnitsSoldWeeklyData(unitsData, selectedWeeklyProjectId || undefined);
    setFilteredWeeklyData(weeklyData);

    // Filter monthly data by project using actual units data
    const monthlyData = generateUnitsSoldMonthlyData(unitsData, selectedMonthlyProjectId || undefined);
    setFilteredMonthlyData(monthlyData);

    // Filter units status data by project
    const statusData = generateUnitsByStatusData(unitsData, selectedUnitsStatusProjectId || undefined);
    setFilteredUnitsStatusData(statusData);
  }, [dashboardData, unitsData, selectedWeeklyProjectId, selectedMonthlyProjectId, selectedUnitsStatusProjectId]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  if (loading || !dashboardData) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.surface}
          />
        }>
        {/* Welcome Section */}
        <View style={styles.section}>
          <Card style={[styles.welcomeCard, shadows.md]}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Card.Content style={styles.welcomeContent}>
                <View style={styles.welcomeTextContainer}>
                  <Text variant="headlineMedium" style={styles.welcomeTitle}>
                    Business Dashboard
                  </Text>
                  <Text variant="bodyMedium" style={styles.welcomeText}>
                    Your key metrics at a glance
                  </Text>
                </View>
                <MaterialCommunityIcons name="view-dashboard" size={48} color="rgba(255, 255, 255, 0.2)" />
              </Card.Content>
            </LinearGradient>
          </Card>
        </View>

        {/* KPI Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: `${theme.colors.onBackground}10` }]}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Key Performance Indicators
            </Text>
          </View>

          <View style={styles.kpiGrid}>
            <KPICard
              title="Total Leads"
              value={dashboardData.totalLeads.toString()}
              icon="account-convert"
              iconColor={theme.colors.primary}
              subtitle="Unconverted leads in pipeline"
              gradientColors={[
                theme.colors.surfaceVariant,
                `${theme.colors.surfaceVariant}CC`
              ]}
            />

            <KPICard
              title="Total Projects"
              value={dashboardData.totalProjects.toString()}
              icon="briefcase"
              iconColor="#8B5CF6"
              subtitle="Ongoing and completed"
              gradientColors={[
                theme.colors.surfaceVariant,
                `${theme.colors.surfaceVariant}CC`
              ]}
            />

            <KPICard
              title="Total Revenue"
              value={formatCurrency(dashboardData.totalRevenue)}
              icon="cash-multiple"
              iconColor="#10B981"
              subtitle="Total value of sold units"
              gradientColors={[
                theme.colors.surfaceVariant,
                `${theme.colors.surfaceVariant}CC`
              ]}
            />

            <KPICard
              title="Pending Amount"
              value={formatCurrency(dashboardData.totalPendingAmount)}
              icon="clock-outline"
              iconColor="#F59E0B"
              subtitle="Total balance amount"
              gradientColors={[
                theme.colors.surfaceVariant,
                `${theme.colors.surfaceVariant}CC`
              ]}
            />
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: `${theme.colors.onBackground}10` }]}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Analytics
            </Text>
          </View>

          <ChartCard
            title="Lead Status"
            subtitle="Distribution by status"
            data={dashboardData.leadsByStatus}
            type="pie"
            icon="chart-pie"
          />

          <ChartCard
            title="Project Status"
            subtitle="Distribution by status"
            data={dashboardData.projectsByStatus}
            type="pie"
            icon="chart-pie"
          />

          <ChartCard
            title="Revenue Trend"
            subtitle="Monthly revenue for the last 6 months"
            data={dashboardData.revenueData}
            type="line"
            icon="chart-line"
          />

          <ChartCard
            title="Units by Status"
            subtitle="Distribution of units/flats by status"
            data={filteredUnitsStatusData}
            type="bar"
            icon="chart-bar"
            onProjectSelect={setSelectedUnitsStatusProjectId}
            projectOptions={[
              { label: 'All Projects', value: null },
              ...dashboardData.projects.map(p => ({ label: p.name, value: p.id }))
            ]}
            selectedProjectId={selectedUnitsStatusProjectId}
          />

          <ChartCard
            title="Units Sold - Weekly"
            subtitle="Number of units sold in past 6 weeks"
            data={filteredWeeklyData}
            type="bar"
            icon="chart-bar"
            onProjectSelect={setSelectedWeeklyProjectId}
            projectOptions={[
              { label: 'All Projects', value: null },
              ...dashboardData.projects.map(p => ({ label: p.name, value: p.id }))
            ]}
            selectedProjectId={selectedWeeklyProjectId}
          />

          <ChartCard
            title="Units Sold - Monthly"
            subtitle="Number of units sold in past 6 months"
            data={filteredMonthlyData}
            type="bar"
            icon="chart-bar"
            onProjectSelect={setSelectedMonthlyProjectId}
            projectOptions={[
              { label: 'All Projects', value: null },
              ...dashboardData.projects.map(p => ({ label: p.name, value: p.id }))
            ]}
            selectedProjectId={selectedMonthlyProjectId}
          />
        </View>
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
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  twoColumnSection: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  leftColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rightColumn: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  welcomeCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: borderRadius.lg,
  },
  welcomeContent: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
  },

});

export default DashboardScreen;
