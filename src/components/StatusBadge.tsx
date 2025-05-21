import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const StatusBadge = ({ status, size = 'medium', showIcon = true }: StatusBadgeProps) => {
  const theme = useTheme();

  // Status color and icon mapping
  const getStatusInfo = (status: string) => {
    switch (status) {
      // Lead statuses
      case 'Lead':
        return {
          color: '#F59E0B', // Amber
          icon: 'account-arrow-right'
        };
      case 'Contacted':
        return {
          color: '#3B82F6', // Blue
          icon: 'phone-check'
        };
      case 'Quote Given':
        return {
          color: '#8B5CF6', // Purple
          icon: 'file-document-outline'
        };
      case 'Converted':
        return {
          color: '#10B981', // Green
          icon: 'check-circle-outline'
        };

      // Project statuses
      case 'Not Started':
        return {
          color: '#EF4444', // Red
          icon: 'clock-outline'
        };
      case 'In Progress':
        return {
          color: '#3B82F6', // Blue
          icon: 'progress-clock'
        };
      case 'Completed':
        return {
          color: '#10B981', // Green
          icon: 'check-circle-outline'
        };

      // Unit statuses
      case 'Available':
        return {
          color: '#10B981', // Green
          icon: 'home-outline'
        };
      case 'Booked':
        return {
          color: '#F59E0B', // Amber
          icon: 'bookmark-outline'
        };
      case 'Sold':
        return {
          color: '#3B82F6', // Blue
          icon: 'home-check'
        };

      // Customer schedule statuses
      case 'Pending':
        return {
          color: '#F59E0B', // Amber
          icon: 'clock-alert-outline'
        };
      case 'Paid':
        return {
          color: '#10B981', // Green
          icon: 'cash-check'
        };

      default:
        return {
          color: theme.colors.primary,
          icon: 'information-outline'
        };
    }
  };

  // Size mapping
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          height: 22,
          fontSize: 10,
          paddingHorizontal: 8,
          iconSize: 12,
        };
      case 'large':
        return {
          height: 32,
          fontSize: 14,
          paddingHorizontal: 12,
          iconSize: 18,
        };
      case 'medium':
      default:
        return {
          height: 26,
          fontSize: 12,
          paddingHorizontal: 10,
          iconSize: 14,
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const sizeStyles = getSize();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusInfo.color + '15', // Very light background
          borderColor: statusInfo.color + '30', // Light border
          borderLeftColor: statusInfo.color, // Solid left border
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        }
      ]}
    >
      {showIcon && (
        <MaterialCommunityIcons
          name={statusInfo.icon as any}
          size={sizeStyles.iconSize}
          color={statusInfo.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: statusInfo.color,
            fontSize: sizeStyles.fontSize,
          }
        ]}
        numberOfLines={1}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderLeftWidth: 3,
    alignSelf: 'flex-start', // Allow badge to size based on content
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
  },
});

export default StatusBadge;
