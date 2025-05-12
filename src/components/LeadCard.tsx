import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, useTheme, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Lead } from '../types';
import { shadows, spacing, borderRadius } from '../constants/theme';
import { usePressAnimation, useStaggeredAnimation } from '../utils/animationUtils';
import AnimatedAvatarText from './AnimatedAvatarText';
import StatusBadge from './StatusBadge';

interface LeadCardProps {
  lead: Lead;
  onPress: (lead: Lead) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: number) => void;
  index?: number; // For staggered animations
}

const AnimatedCard = Animated.createAnimatedComponent(Card);

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
          {/* Header Section with Name and Status */}
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <AnimatedAvatarText
                size={40}
                label={getInitials(lead.name)}
                style={[
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: borderRadius.round,
                  },
                ]}
              />
              <Text variant="titleMedium" style={styles.name}>
                {lead.name}
              </Text>
            </View>
            <StatusBadge status={lead.status} size="medium" />
          </View>

          <Divider style={styles.divider} />

          {/* Details Section */}
          <View style={styles.detailsContainer}>
            {lead.enquiry_for && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {lead.enquiry_for}
                </Text>
              </View>
            )}

            {lead.budget && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="currency-inr"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {formatBudget(lead.budget)}
                </Text>
              </View>
            )}

            {lead.lead_source && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="source-branch"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {lead.lead_source}
                </Text>
              </View>
            )}

            {lead.reference && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="account-arrow-right-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {lead.reference}
                </Text>
              </View>
            )}
          </View>

          {/* Actions Section */}
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.secondary}
                onPress={() => onEdit(lead)}
                style={styles.actionButton}
              />
            )}
            {onDelete && lead.id && (
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => onDelete(lead.id!)}
                style={styles.actionButton}
              />
            )}
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
    padding: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  detailsContainer: {
    marginVertical: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailIcon: {
    marginRight: spacing.sm,
  },
  detailText: {
    color: '#666',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  actionButton: {
    margin: 0,
  },
});

export default LeadCard;
