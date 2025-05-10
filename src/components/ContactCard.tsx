import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Contact } from '../types';
import { shadows, spacing } from '../constants/theme';

interface ContactCardProps {
  contact: Contact;
  onPress: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: number) => void;
}

const ContactCard = ({ contact, onPress, onEdit, onDelete }: ContactCardProps) => {
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
      onPress={() => onPress(contact)}
    >
      <Card.Content style={styles.content}>
        <View style={styles.leftContent}>
          <Avatar.Text
            size={50}
            label={getInitials(contact.name)}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <View style={styles.details}>
            <Text variant="titleMedium" style={styles.name}>
              {contact.name}
            </Text>
            {contact.company && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {contact.company}
              </Text>
            )}
            {contact.email && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {contact.email}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.actions}>
          {contact.phone && (
            <IconButton
              icon="phone"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => {}}
            />
          )}
          {onEdit && (
            <IconButton
              icon="pencil"
              size={20}
              iconColor={theme.colors.secondary}
              onPress={() => onEdit(contact)}
            />
          )}
          {onDelete && contact.id && (
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => onDelete(contact.id!)}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
  },
});

export default ContactCard;
