import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import StatusBadge from '../components/StatusBadge';

import { UnitFlat } from '../types';
import { spacing, shadows, borderRadius } from '../constants/theme';
import { UNIT_STATUS_COLORS } from '../constants';
import { formatCurrency } from '../utils/formatters';

interface UnitFlatCardProps {
  unit: UnitFlat & { client_name?: string };
  project?: { name: string };
  onPress: (unit: UnitFlat) => void;
  onEdit: (unit: UnitFlat) => void;
  onDelete: (unitId: number) => void;
  onExport?: (unit: UnitFlat) => void; // For agreement
  onExportPaymentRequest?: (unit: UnitFlat) => void; // For payment request
  index: number;
}

const UnitFlatCard: React.FC<UnitFlatCardProps> = ({
  unit,
  project,
  onPress,
  onEdit,
  onDelete,
  onExport,
  onExportPaymentRequest, // Destructure new prop
  index,
}) => {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(300)}
      style={styles.container}
    >
      <Card
        style={[styles.card, shadows.md]}
        onPress={() => onPress(unit)}
      >
        <LinearGradient
          colors={[
            theme.dark ? theme.colors.surface : '#FFFFFF',
            theme.dark ? theme.colors.surfaceVariant : '#F5F8FF'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.title}>
                {unit.flat_no}
              </Text>
              <StatusBadge
                status={unit.status}
                size="small"
                showIcon={true}
              />
            </View>
            <View style={styles.actions}>
              {onExportPaymentRequest && ( // New button for payment request
                <IconButton
                  icon="receipt" // Changed icon for payment request
                  size={20}
                  onPress={() => onExportPaymentRequest(unit)}
                  style={styles.iconButton}
                  accessibilityLabel="Export Payment Request"
                />
              )}
              {onExport && (
                <IconButton
                  icon="file-document-outline"
                  size={20}
                  onPress={() => onExport(unit)}
                  style={styles.iconButton}
                  accessibilityLabel="Export Agreement"
                />
              )}
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => onEdit(unit)}
                style={styles.iconButton}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => onDelete(unit.id!)}
                style={styles.iconButton}
              />
            </View>
          </View>

          {project && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="office-building"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {project.name}
              </Text>
            </View>
          )}

          {unit.client_name && unit.status === 'Sold' && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {unit.client_name}
              </Text>
            </View>
          )}

          {unit.type && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="home-variant"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {unit.type}
              </Text>
            </View>
          )}

          {unit.category && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="tag"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {unit.category}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="ruler-square"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={styles.infoText}>
              {unit.area_sqft} sqft @ ₹{unit.rate_per_sqft}/sqft
            </Text>
          </View>

          <View style={styles.financialInfo}>
            <View style={styles.financialItem}>
              <Text variant="labelSmall" style={styles.financialLabel}>
                Flat Value
              </Text>
              <Text variant="titleSmall" style={styles.financialValue}>
                {formatCurrency(unit.flat_value || 0)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text variant="labelSmall" style={styles.financialLabel}>
                Received
              </Text>
              <Text variant="titleSmall" style={styles.financialValue}>
                {formatCurrency(unit.received_amount || 0)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text variant="labelSmall" style={styles.financialLabel}>
                Balance
              </Text>
              <Text variant="titleSmall" style={styles.financialValue}>
                {formatCurrency(unit.balance_amount || 0)}
              </Text>
            </View>
          </View>
        </Card.Content>
        </LinearGradient>
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
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
  },
  content: {
    padding: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 24,
    borderRadius: borderRadius.sm,
  },
  actions: {
    flexDirection: 'row',
  },
  iconButton: {
    margin: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    marginLeft: spacing.xs,
    color: '#666',
  },
  financialInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    color: '#666',
    marginBottom: 2,
  },
  financialValue: {
    fontWeight: '600',
  },
});

export default UnitFlatCard;
