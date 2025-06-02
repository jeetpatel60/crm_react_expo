import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, spacing, borderRadius } from '../constants/theme';

export type ChartType = 'pie' | 'bar' | 'line';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  type: ChartType;
  height?: number;
  colorScale?: string[];
  icon?: string;
  onProjectSelect?: (projectId: number | null) => void;
  projectOptions?: { label: string; value: number | null }[];
  selectedProjectId?: number | null;
}

const ChartCard = ({
  title,
  subtitle,
  data,
  type,
  height = 220,
  colorScale,
  icon,
  onProjectSelect,
  projectOptions,
  selectedProjectId
}: ChartCardProps) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width - (spacing.md * 4);

  // Define colors for different chart types
  const chartColors = {
    pie: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    bar: ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'],
    line: ['#10B981', '#34D399', '#6EE7B7']
  };

  // Use appropriate colors based on chart type
  const colors = colorScale || chartColors[type] || chartColors.pie;

  // Get total for pie charts
  const total = data.reduce((sum, item) => sum + (item.y || 0), 0);

  // Simplified chart rendering - just show data summary
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <View style={[styles.emptyChart, { minHeight: height, backgroundColor: `${theme.colors.onSurface}05` }]}>
          <MaterialCommunityIcons
            name={
              (type === 'pie'
                ? 'chart-pie'
                : type === 'bar'
                  ? 'chart-bar'
                  : 'chart-line') as any
            }
            size={36}
            color={theme.colors.primary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No data available</Text>
        </View>
      );
    }

    // Get total for pie charts
    const total = data.reduce((sum, item) => sum + (item.y || 0), 0);

    switch (type) {
      case 'pie':
        return (
          <View style={[styles.chartContent, { backgroundColor: `${theme.colors.onSurface}05` }]}>
            <View style={styles.pieContainer}>
              <View style={styles.pieChart}>
                {data.map((item, index) => {
                  const percentage = Math.round((item.y / total) * 100);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.pieSegment,
                        {
                          flex: item.y,
                          backgroundColor: colors[index % colors.length]
                        }
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={[styles.chartText, { color: theme.colors.onSurface }]}>
                Total: {total}
              </Text>
            </View>
          </View>
        );

      case 'bar':
        return (
          <View style={[styles.chartContent, { backgroundColor: `${theme.colors.onSurface}05` }]}>
            <View style={styles.barContainer}>
              {data.map((item, index) => {
                // Find the max value to scale bars
                const maxValue = Math.max(...data.map(d => d.y));
                const barHeight = (item.y / maxValue) * 150; // Scale to max height of 150

                return (
                  <View key={index} style={styles.barItem}>
                    <View style={styles.barLabelContainer}>
                      <Text style={[styles.barLabel, { color: theme.colors.onSurface }]} numberOfLines={1} ellipsizeMode="tail">
                        {item.x}
                      </Text>
                    </View>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: colors[index % colors.length]
                          }
                        ]}
                      />
                      <Text style={[styles.barValue, { color: theme.colors.onSurface }]}>{item.y}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'line':
        return (
          <View style={[styles.chartContent, { backgroundColor: `${theme.colors.onSurface}05` }]}>
            <Text style={[styles.chartText, { color: theme.colors.onSurface }]}>
              Revenue trend over time
            </Text>
            <View style={styles.lineContainer}>
              {data.map((item, index) => (
                <View key={index} style={[styles.lineItem, { borderBottomColor: `${theme.colors.onSurface}10` }]}>
                  <Text style={[styles.lineLabel, { color: theme.colors.onSurface }]}>{item.x}</Text>
                  <Text style={[styles.lineValue, { color: theme.colors.onSurface }]}>{item.y}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const gradientColors = [
    `${theme.colors.surface}CC`, // 80% opacity
    `${theme.colors.surfaceVariant}99`, // 60% opacity
  ];

  return (
    <Card style={[styles.card, shadows.md]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Card.Content style={styles.cardContent}>
          <View style={[styles.header, { borderBottomColor: `${theme.colors.onSurface}10` }]}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                {title}
              </Text>
              {subtitle && (
                <Text
                  variant="bodySmall"
                  style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.onSurface}08` }]}>
                <MaterialCommunityIcons
                  name={icon as any}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>

          {/* Project filter dropdown */}
          {projectOptions && projectOptions.length > 0 && onProjectSelect && (
            <View style={styles.filterContainer}>
              <Text variant="bodySmall" style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Filter by project:</Text>
              <View style={styles.pickerContainer}>
                <MaterialCommunityIcons name="filter-variant" size={16} color={theme.colors.primary} style={styles.filterIcon} />
                <View style={[styles.picker, { backgroundColor: `${theme.colors.onSurface}08` }]}>
                  <Text
                    style={[styles.pickerText, { color: theme.colors.onSurface }]}
                    onPress={() => {
                      // Show project selection modal or dropdown
                      // For simplicity, we'll just cycle through options
                      const currentIndex = projectOptions.findIndex(p => p.value === selectedProjectId);
                      const nextIndex = (currentIndex + 1) % projectOptions.length;
                      onProjectSelect(projectOptions[nextIndex].value);
                    }}
                  >
                    {selectedProjectId === null
                      ? 'All Projects'
                      : projectOptions.find(p => p.value === selectedProjectId)?.label || 'Select Project'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.onSurfaceVariant} />
                </View>
              </View>
            </View>
          )}

          <View style={styles.chartContainer}>
            {renderChart()}
          </View>

          {/* Legend */}
          {data.length > 0 && (
            <View style={[styles.legendContainer, { backgroundColor: `${theme.colors.onSurface}05` }]}>
              {data.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: colors[index % colors.length] }
                    ]}
                  />
                  <Text style={[styles.legendText, { color: theme.colors.onSurface }]} numberOfLines={1} ellipsizeMode="tail">
                    {item.x}: {item.y} {type === 'pie' && `(${Math.round((item.y / total) * 100)}%)`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </LinearGradient>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: borderRadius.lg,
  },
  cardContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  chartContent: {
    width: '100%',
    minHeight: 200,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChart: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  emptyText: {
    marginTop: spacing.sm,
  },
  chartText: {
    marginTop: spacing.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  pieContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    width: '100%',
  },
  pieChart: {
    flexDirection: 'row',
    height: 20,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  pieSegment: {
    height: '100%',
  },
  // Bar chart styles
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: 200,
    paddingTop: 20,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    marginHorizontal: 2,
  },
  barLabelContainer: {
    position: 'absolute',
    bottom: -25,
    width: '100%',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
    transform: [{ rotate: '-45deg' }],
    width: 60,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: '80%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    fontSize: 10,
    marginTop: 2,
  },
  // Line chart styles
  lineContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  lineLabel: {
    fontSize: 12,
  },
  lineValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendContainer: {
    width: '100%',
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
  },
  filterContainer: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    marginRight: spacing.sm,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterIcon: {
    marginRight: spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flex: 1,
  },
  pickerText: {
    fontSize: 12,
    flex: 1,
  },
});

export default ChartCard;
