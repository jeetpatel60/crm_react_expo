import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Client } from '../types';
import { shadows, spacing } from '../constants/theme';

interface ClientCardProps {
  client: Client;
  onPress: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: number) => void;
}

const ClientCard = ({ client, onPress, onEdit, onDelete }: ClientCardProps) => {
  const theme = useTheme();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card
      style={[
        styles.card,
        shadows.md,
        { backgroundColor: theme.colors.surface }
      ]}
      onPress={() => onPress(client)}
    >
      <Card.Content style={styles.content}>
        <View style={styles.leftContent}>
          <Avatar.Text
            size={50}
            label={getInitials(client.name)}
            style={{ backgroundColor: theme.colors.primary }}
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
              size={20}
              iconColor={theme.colors.secondary}
              onPress={() => onEdit(client)}
            />
          )}
          {onDelete && client.id && (
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => onDelete(client.id!)}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
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
  },
  actions: {
    flexDirection: 'row',
  },
});

export default ClientCard;
