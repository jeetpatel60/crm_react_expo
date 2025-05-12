import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { spacing } from '../constants/theme';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

const StatusChip = ({ status, size = 'medium' }: StatusChipProps) => {
  const theme = useTheme();

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
      // Project statuses
      case 'Not Started':
        return '#6B7280'; // Gray
      case 'In Progress':
        return '#3B82F6'; // Blue
      case 'Completed':
        return '#10B981'; // Green
      // Unit statuses
      case 'Available':
        return '#10B981'; // Green
      case 'Booked':
        return '#F59E0B'; // Amber
      case 'Sold':
        return '#3B82F6'; // Blue
      default:
        return theme.colors.primary;
    }
  };

  // Size mapping
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          height: 24,
          minWidth: 60, // Further reduced width
          fontSize: 10,
        };
      case 'large':
        return {
          height: 32,
          minWidth: 80, // Further reduced width
          fontSize: 12,
        };
      case 'medium':
      default:
        return {
          height: 32,
          minWidth: 70, // Further reduced width
          fontSize: 14,
        };
    }
  };

  const sizeStyles = getSize();

  return (
    <View style={styles.chipContainer}>
      <Chip
        style={[
          styles.chip,
          {
            backgroundColor: getStatusColor(status) + '20',
            height: sizeStyles.height,
            minWidth: sizeStyles.minWidth,
            paddingBottom: 0,
            paddingTop: 0,
          },
        ]}
        textStyle={{
          color: getStatusColor(status),
          fontWeight: '500',
          textAlign: 'center',
          textAlignVertical: 'center',
          fontSize: sizeStyles.fontSize,
          paddingHorizontal: 0,
          paddingVertical: 0, // Add minimal padding to ensure text is visible
        }}
        ellipsizeMode="tail"
      >
        {status}
      </Chip>
    </View>
  );
};

const styles = StyleSheet.create({
  chipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 0, // Minimal horizontal padding
    paddingVertical: 0, // Minimal vertical padding
  },
});

export default StatusChip;

