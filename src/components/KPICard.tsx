import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, spacing, borderRadius } from '../constants/theme';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradientColors?: string[];
}

const KPICard = ({
  title,
  value,
  icon,
  iconColor,
  subtitle,
  trend,
  gradientColors,
}: KPICardProps) => {
  const theme = useTheme();

  const defaultGradientColors = [
    theme.colors.primaryContainer,
    theme.colors.surfaceVariant,
  ];

  return (
    <Card style={[styles.card, shadows.md]}>
      <LinearGradient
        colors={gradientColors || defaultGradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>
              {title}
            </Text>

            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                size={24}
                color={iconColor || theme.colors.primary}
              />
            </View>
          </View>

          <Text variant="headlineMedium" style={styles.value}>
            {value}
          </Text>

          {subtitle && (
            <Text
              variant="bodySmall"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              {subtitle}
            </Text>
          )}

          {trend && (
            <View style={styles.trendContainer}>
              <MaterialCommunityIcons
                name={trend.isPositive ? 'arrow-up' : 'arrow-down'}
                size={16}
                color={trend.isPositive ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color: trend.isPositive ? '#10B981' : '#EF4444',
                  },
                ]}
              >
                {trend.value}%
              </Text>
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
    overflow: 'hidden',
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    width: '100%',
    height: 140,
  },
  gradient: {
    borderRadius: borderRadius.lg,
    height: '100%',
  },
  content: {
    padding: spacing.md,
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '500',
  },
  value: {
    fontWeight: 'bold',
    fontSize: 24,
    marginVertical: spacing.sm,
    flexWrap: 'wrap',
  },
  subtitle: {
    opacity: 0.7,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trendText: {
    fontWeight: '500',
    marginLeft: 2,
  },
});

export default KPICard;

