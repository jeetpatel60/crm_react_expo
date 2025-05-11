import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, Avatar, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Client } from '../types';
import { shadows, spacing, borderRadius, animations } from '../constants/theme';
import { useFadeScaleAnimation, usePressAnimation, useStaggeredAnimation } from '../utils/animationUtils';
import AnimatedAvatarText from './AnimatedAvatarText';

interface ClientCardProps {
  client: Client;
  onPress: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: number) => void;
  index?: number; // For staggered animations
}

const AnimatedCard = Animated.createAnimatedComponent(Card);

const ClientCard = ({ client, onPress, onEdit, onDelete, index = 0 }: ClientCardProps) => {
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

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => onPress(client)}
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
            <AnimatedAvatarText
              size={50}
              label={getInitials(client.name)}
              style={[
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: borderRadius.round,
                },
              ]}
            />
            <View style={styles.details}>
              <Text variant="titleMedium" style={styles.name}>
                {client.name}
              </Text>
              {client.gstin_no && (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  GSTIN: {client.gstin_no}
                </Text>
              )}
              {client.email && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {client.email}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={22}
                iconColor={theme.colors.secondary}
                onPress={() => onEdit(client)}
                style={styles.actionButton}
              />
            )}
            {onDelete && client.id && (
              <IconButton
                icon="delete"
                size={22}
                iconColor={theme.colors.error}
                onPress={() => onDelete(client.id!)}
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
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  details: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
    marginLeft: spacing.xs,
  },
});

export default ClientCard;
