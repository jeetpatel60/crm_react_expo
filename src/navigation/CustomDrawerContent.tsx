import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Divider, Text, useTheme, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeInRight, FadeIn } from 'react-native-reanimated';
import { APP_NAME } from '../constants';
import { spacing, shadows, borderRadius, animations } from '../constants/theme';
import AnimatedAvatarText from '../components/AnimatedAvatarText';

// Create animated components
const AnimatedView = Animated.createAnimatedComponent(View);

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const theme = useTheme();
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const { state, descriptors, navigation } = props;

  // Custom drawer item component
  const DrawerItemCustom = ({
    label,
    icon,
    onPress,
    isFocused = false,
    isSubmenuItem = false
  }: {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    isFocused?: boolean;
    isSubmenuItem?: boolean;
  }) => {
    return (
      <TouchableOpacity
        style={[
          styles.drawerItemContainer,
          isSubmenuItem ? styles.submenuItemContainer : null,
          isFocused && { backgroundColor: theme.colors.primaryContainer + '40' }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        // Ensure touch events are captured properly
        delayPressIn={0}
        pressRetentionOffset={{ top: 30, left: 30, bottom: 30, right: 30 }}
        hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
      >
        <View style={styles.drawerItemContent}>
          <View style={styles.iconContainer}>{icon}</View>
          <Text
            style={[
              isSubmenuItem ? styles.submenuLabel : styles.drawerLabel,
              { color: isFocused ? theme.colors.primary : theme.colors.onSurface }
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Function to render drawer items
  const renderDrawerItems = () => {

    return state.routes.map((route, index) => {
      const { options } = descriptors[route.key];
      const label = options.title || route.name;
      const isFocused = state.index === index;

      // Special handling for Reports menu
      if (route.name === 'Reports') {
        return (
          <View key={route.key}>
            {/* Main Reports menu item */}
            <DrawerItemCustom
              label={label}
              icon={
                <MaterialCommunityIcons
                  name="file-chart"
                  color={isFocused ? theme.colors.primary : theme.colors.onSurface}
                  size={24}
                />
              }
              onPress={() => {
                // Toggle submenu expansion
                setReportsExpanded(!reportsExpanded);

                // Close drawer first
                props.navigation.closeDrawer();

                // Navigate with delay
                setTimeout(() => {
                  navigation.navigate('Reports', { screen: 'ReportsLanding' });
                }, 500);
              }}
              isFocused={isFocused}
            />

            {/* Submenu for Reports */}
            {reportsExpanded && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.submenuContainer}
              >
                <DrawerItemCustom
                  label="Customer Ledger Report"
                  icon={
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      color={theme.colors.onSurface}
                      size={22}
                    />
                  }
                  onPress={() => {
                    // Close drawer first
                    props.navigation.closeDrawer();

                    // Navigate with delay
                    setTimeout(() => {
                      navigation.navigate('Reports', { screen: 'CustomerLedgerReport' });
                    }, 500);
                  }}
                  isSubmenuItem={true}
                />
                <DrawerItemCustom
                  label="Flats Availability Report"
                  icon={
                    <MaterialCommunityIcons
                      name="home-city-outline"
                      color={theme.colors.onSurface}
                      size={22}
                    />
                  }
                  onPress={() => {
                    // Close drawer first
                    props.navigation.closeDrawer();

                    // Navigate with delay
                    setTimeout(() => {
                      navigation.navigate('Reports', { screen: 'FlatsAvailabilityReport' });
                    }, 500);
                  }}
                  isSubmenuItem={true}
                />
              </Animated.View>
            )}
          </View>
        );
      }

      // Regular menu items
      return (
        <DrawerItemCustom
          key={route.key}
          label={label}
          icon={
            options.drawerIcon ?
              options.drawerIcon({
                color: isFocused ? theme.colors.primary : theme.colors.onSurface,
                size: 24,
                focused: isFocused
              }) :
              <MaterialCommunityIcons
                name="circle"
                color={isFocused ? theme.colors.primary : theme.colors.onSurface}
                size={24}
              />
          }
          onPress={() => {
            // Close drawer first
            props.navigation.closeDrawer();

            // Navigate with delay
            setTimeout(() => {
              navigation.navigate(route.name);
            }, 500);
          }}
          isFocused={isFocused}
        />
      );
    });
  };

  return (
    <View
      style={[
        { backgroundColor: theme.colors.surface, flex: 1 },
        styles.container
      ]}
    >
      {/* Fixed Header */}
      <AnimatedView
        style={[
          styles.header,
          { backgroundColor: theme.colors.primary },
          shadows.lg
        ]}
        entering={FadeIn.duration(animations.duration.standard)}
      >
        <View style={styles.userInfo}>
          <AnimatedAvatarText
            size={60}
            label="CRM"
            style={[
              { backgroundColor: theme.colors.primaryContainer },
              styles.avatar,
              shadows.md
            ]}
            color={theme.colors.onPrimaryContainer}
            entering={FadeInLeft.delay(300).duration(animations.duration.standard)}
          />
          <AnimatedView
            style={styles.userDetails}
            entering={FadeInRight.delay(400).duration(animations.duration.standard)}
          >
            <Text style={[styles.appName, { color: '#fff' }]}>{APP_NAME}</Text>
            <Text style={[styles.version, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              Version 1.0.0
            </Text>
            <Button
              mode="text"
              compact
              style={styles.profileButton}
              textColor="#fff"
              labelStyle={{ fontSize: 12 }}
            >
              View Profile
            </Button>
          </AnimatedView>
        </View>
      </AnimatedView>

      <Divider style={styles.topDivider} />

      {/* Scrollable Menu Items */}
      <ScrollView
        style={styles.scrollableArea}
        contentContainerStyle={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <AnimatedView
          style={styles.drawerContent}
          entering={FadeIn.delay(500).duration(animations.duration.standard)}
        >
          {renderDrawerItems()}
        </AnimatedView>
      </ScrollView>

      {/* Fixed Footer */}
      <Divider style={styles.divider} />

      <AnimatedView
        style={styles.footer}
        entering={FadeIn.delay(600).duration(animations.duration.standard)}
      >
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          © 2025 CRM App
        </Text>
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopRightRadius: borderRadius.xs,
    borderBottomRightRadius: borderRadius.xs,
  },
  scrollableArea: {
    flex: 1,
  },
  scrollableContent: {
    paddingBottom: spacing.md,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomRightRadius: borderRadius.xs,
    marginBottom: 0,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: borderRadius.round,
  },
  userDetails: {
    marginLeft: spacing.md,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  profileButton: {
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  drawerContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  topDivider: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1,
  },
  divider: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  // Drawer item styles
  drawerItemContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: 2,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    minHeight: 54,
  },
  submenuItemContainer: {
    paddingVertical: spacing.xs,
    marginVertical: 2,
    paddingHorizontal: spacing.xs,
    minHeight: 48,
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  submenuLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  submenuContainer: {
    marginLeft: spacing.lg,
    marginTop: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

export default CustomDrawerContent;
