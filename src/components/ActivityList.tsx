import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, useTheme, Divider, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shadows, spacing, borderRadius } from '../constants/theme';

export interface Activity {
  id: string | number;
  title: string;
  description?: string;
  timestamp: number;
  icon: string;
  iconColor?: string;
  iconBackground?: string;
}

interface ActivityListProps {
  title: string;
  activities: Activity[];
  maxItems?: number;
}

const ActivityList = ({ title, activities, maxItems = 5 }: ActivityListProps) => {
  const theme = useTheme();
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const formatTimestamp = (timestamp: number): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMs = now.getTime() - activityDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes} min ago`;
      }
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return activityDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderItem = ({ item, index }: { item: Activity; index: number }) => (
    <View>
      <View style={styles.activityItem}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: item.iconBackground || theme.colors.primaryContainer,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={item.iconColor || theme.colors.primary}
          />
        </View>
        <View style={styles.activityContent}>
          <Text variant="bodyMedium" style={styles.activityTitle}>
            {item.title}
          </Text>
          {item.description && (
            <Text
              variant="bodySmall"
              style={[styles.activityDescription, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
        </View>
        <Text
          variant="bodySmall"
          style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
        >
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      {index < displayActivities.length - 1 && <Divider style={styles.divider} />}
    </View>
  );

  return (
    <Card style={[styles.card, shadows.md]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.primary} />
        </View>
        <FlatList
          data={displayActivities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
        {activities.length > maxItems && (
          <Button
            mode="text"
            onPress={() => {}}
            style={styles.viewMoreButton}
          >
            View all activities
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
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
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  activityTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 11,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  viewMoreButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
});

export default ActivityList;
