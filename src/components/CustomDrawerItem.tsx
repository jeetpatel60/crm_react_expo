import React from 'react';
import { 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  Text,
  GestureResponderEvent
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing, borderRadius } from '../constants/theme';

interface CustomDrawerItemProps {
  label: string;
  icon: React.ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  isFocused?: boolean;
  isSubmenuItem?: boolean;
}

/**
 * A custom drawer item component that handles touch events more reliably
 * than the default DrawerItem component from @react-navigation/drawer
 */
const CustomDrawerItem: React.FC<CustomDrawerItemProps> = ({
  label,
  icon,
  onPress,
  isFocused = false,
  isSubmenuItem = false,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSubmenuItem ? styles.submenuContainer : null,
        isFocused && { backgroundColor: theme.colors.primaryContainer + '40' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      // Ensure touch events are captured properly
      delayPressIn={0}
      pressRetentionOffset={{ top: 20, left: 20, bottom: 20, right: 20 }}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{icon}</View>
        <Text
          style={[
            isSubmenuItem ? styles.submenuLabel : styles.label,
            { color: isFocused ? theme.colors.primary : theme.colors.onSurface },
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: 3,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    minHeight: 48,
  },
  submenuContainer: {
    paddingVertical: spacing.sm,
    marginVertical: 2,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  submenuLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default CustomDrawerItem;
