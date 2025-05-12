import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

const StatusChip = ({ status, size = 'medium' }: StatusChipProps) => {
  const theme = useTheme();

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      // Lead statuses
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
        return '#EF4444'; // Red
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

      // Milestone statuses (same as project statuses)
      // These are already covered by the project statuses above
      // but listed here for clarity

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
          fontSize: 10,
          paddingHorizontal: 8,
        };
      case 'large':
        return {
          height: 32,
          fontSize: 12,
          paddingHorizontal: 12,
        };
      case 'medium':
      default:
        return {
          height: 28,
          fontSize: 12,
          paddingHorizontal: 10,
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
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
        ]}
        textStyle={{
          color: getStatusColor(status),
          fontWeight: '500',
          textAlign: 'center',
          fontSize: sizeStyles.fontSize,
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
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start', // Allow chip to size based on content
  },
});

export default StatusChip;

