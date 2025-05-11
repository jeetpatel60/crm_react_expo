import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { AgreementTemplate, PaymentRequestTemplate } from '../types';
import { spacing, shadows, borderRadius } from '../constants/theme';

interface TemplateCardProps {
  template: AgreementTemplate | PaymentRequestTemplate;
  onPress: (template: AgreementTemplate | PaymentRequestTemplate) => void;
  onEdit: (template: AgreementTemplate | PaymentRequestTemplate) => void;
  onDelete: (templateId: number) => void;
  index: number;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPress,
  onEdit,
  onDelete,
  index,
}) => {
  const theme = useTheme();
  
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(300)}
      style={styles.container}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(template)}
      >
        <Card
          style={[
            styles.card,
            shadows.md,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Card.Content style={styles.content}>
            <View style={styles.leftContent}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={40}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <View style={styles.details}>
                <Text variant="titleMedium" style={styles.name}>
                  {template.name}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  numberOfLines={1}
                >
                  Last updated: {new Date(template.updated_at || 0).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.actions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => onEdit(template)}
                style={styles.actionButton}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => onDelete(template.id!)}
                style={styles.actionButton}
              />
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
});

export default TemplateCard;
