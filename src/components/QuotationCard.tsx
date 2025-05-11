import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { Quotation } from '../types';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { formatCurrency, formatDate } from '../utils/formatters';

interface QuotationCardProps {
  quotation: Quotation;
  projectName?: string;
  leadName?: string;
  flatNo?: string;
  companyName?: string;
  onPress: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotationId: number) => void;
  index: number;
}

const QuotationCard: React.FC<QuotationCardProps> = ({
  quotation,
  projectName,
  leadName,
  flatNo,
  companyName,
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
      <Card
        style={[styles.card, shadows.md, { backgroundColor: theme.colors.surface }]}
        onPress={() => onPress(quotation)}
      >
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.title}>
                {quotation.quotation_no}
              </Text>
              <Text variant="bodySmall" style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                {formatDate(quotation.date)}
              </Text>
            </View>
            <View style={styles.actions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => onEdit(quotation)}
                style={styles.actionButton}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => {
                  if (quotation.id) {
                    onDelete(quotation.id);
                  }
                }}
                style={styles.actionButton}
              />
            </View>
          </View>

          <View style={styles.detailsContainer}>
            {projectName && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {projectName}
                </Text>
              </View>
            )}

            {leadName && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="account-convert"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {leadName}
                </Text>
              </View>
            )}

            {flatNo && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="home"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {flatNo}
                </Text>
              </View>
            )}

            {companyName && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="domain"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.detailIcon}
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  {companyName}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {formatCurrency(quotation.total_amount || 0)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.md,
  },
  content: {
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  date: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  detailsContainer: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});

export default QuotationCard;
