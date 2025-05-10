import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, Avatar, useTheme, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Lead } from '../types';
import { shadows, spacing, borderRadius, animations } from '../constants/theme';
import { useFadeScaleAnimation, usePressAnimation, useStaggeredAnimation } from '../utils/animationUtils';

interface LeadCardProps {
  lead: Lead;
  onPress: (lead: Lead) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: number) => void;
  index?: number; // For staggered animations
}

const AnimatedCard = Animated.createAnimatedComponent(Card);
const AnimatedAvatar = Animated.createAnimatedComponent(Avatar.Text);

const LeadCard = ({ lead, onPress, onEdit, onDelete, index = 0 }: LeadCardProps) => {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  // Animations
  const fadeScaleStyle = useStaggeredAnimation(index, true);
  const pressAnimationStyle = usePressAnimation(isPressed);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Lead':
        return '#F59E0B'; // Amber
      case 'Contacted':
        return '#3B82F6'; // Blue
      case 'Quote Given':
        return '#8B5CF6'; // Purple
      case 'Converted':
        return '#10B981'; // Green
      default:
        return theme.colors.primary;
    }
  };

  // Format budget as currency
  const formatBudget = (budget?: number) => {
    if (!budget) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(budget);
  };

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => onPress(lead)}
    >
      <AnimatedCard
        style={[
          styles.card,
          shadows.lg,
          { backgroundColor: theme.colors.surface },
          fadeScaleStyle,
          pressAnimationStyle
        ]}
      >
        <Card.Content style={styles.content}>
          <View style={styles.leftContent}>
            <AnimatedAvatar
              size={50}
              label={getInitials(lead.name)}
              style={[
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.round,
                },
              ]}
            />
            <View style={styles.details}>
              <Text variant="titleMedium" style={styles.name}>
                {lead.name}
              </Text>
              {lead.enquiry_for && (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Enquiry: {lead.enquiry_for}
                </Text>
              )}
              {lead.budget && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Budget: {formatBudget(lead.budget)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.rightContent}>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(lead.status) + '20' }]}
              textStyle={{ color: getStatusColor(lead.status), fontWeight: '500' }}
            >
              {lead.status}
            </Chip>
            <View style={styles.actions}>
              {onEdit && (
                <IconButton
                  icon="pencil"
                  size={20}
                  iconColor={theme.colors.secondary}
                  onPress={() => onEdit(lead)}
                />
              )}
              {onDelete && lead.id && (
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => onDelete(lead.id!)}
                />
              )}
            </View>
          </View>
        </Card.Content>
      </AnimatedCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  details: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusChip: {
    height: 28,
    marginBottom: spacing.xs,
  },
});

export default LeadCard;
