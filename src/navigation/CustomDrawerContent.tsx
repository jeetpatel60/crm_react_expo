import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Divider, Text, useTheme, Avatar, Button } from 'react-native-paper';
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

  // Function to render custom drawer items with submenus
  const renderDrawerItems = () => {
    const { state, descriptors, navigation } = props;

    return state.routes.map((route, index) => {
      const { options } = descriptors[route.key];
      const label = options.title || route.name;
      const isFocused = state.index === index;

      // Special handling for Reports menu
      if (route.name === 'Reports') {
        return (
          <View key={route.key}>
            {/* Main Reports menu item */}
            <DrawerItem
              label={label as string}
              icon={({ color, size }) => (
                <MaterialCommunityIcons name="file-chart" color={color} size={size} />
              )}
              onPress={() => {
                // Toggle submenu expansion
                setReportsExpanded(!reportsExpanded);

                // If submenu is currently collapsed, we're expanding it
                // If submenu is currently expanded, we're collapsing it
                // Also navigate to the Reports landing screen
                navigation.navigate('Reports', { screen: 'ReportsLanding' });
              }}
              focused={isFocused}
              activeTintColor={theme.colors.primary}
              inactiveTintColor={theme.colors.onSurface}
              activeBackgroundColor={theme.colors.primaryContainer + '40'}
              style={[
                styles.drawerItem,
                isFocused && { backgroundColor: theme.colors.primaryContainer + '40' }
              ]}
              labelStyle={styles.drawerLabel}
            />

            {/* Submenu for Reports */}
            {reportsExpanded && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.submenuContainer}
              >
                <DrawerItem
                  label="Customer Ledger Report"
                  icon={({ color, size }) => (
                    <MaterialCommunityIcons name="file-document-outline" color={color} size={size} />
                  )}
                  onPress={() => {
                    // Close drawer after navigation
                    props.navigation.closeDrawer();
                    // Navigate to the specific report screen
                    navigation.navigate('Reports', { screen: 'CustomerLedgerReport' });
                  }}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={theme.colors.onSurface}
                  style={styles.submenuItem}
                  labelStyle={styles.submenuLabel}
                />
                <DrawerItem
                  label="Flats Availability Report"
                  icon={({ color, size }) => (
                    <MaterialCommunityIcons name="home-city-outline" color={color} size={size} />
                  )}
                  onPress={() => {
                    // Close drawer after navigation
                    props.navigation.closeDrawer();
                    // Navigate to the specific report screen
                    navigation.navigate('Reports', { screen: 'FlatsAvailabilityReport' });
                  }}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={theme.colors.onSurface}
                  style={styles.submenuItem}
                  labelStyle={styles.submenuLabel}
                />
              </Animated.View>
            )}
          </View>
        );
      }

      // Regular menu items
      return (
        <DrawerItem
          key={route.key}
          label={label as string}
          icon={options.drawerIcon}
          onPress={() => navigation.navigate(route.name)}
          focused={isFocused}
          activeTintColor={theme.colors.primary}
          inactiveTintColor={theme.colors.onSurface}
          activeBackgroundColor={theme.colors.primaryContainer + '40'}
          style={styles.drawerItem}
          labelStyle={styles.drawerLabel}
        />
      );
    });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1 }} // Changed from flex: 1 to flexGrow: 1 to allow scrolling
      style={[
        { backgroundColor: theme.colors.surface },
        styles.scrollView
      ]}
    >
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
            size={60} // Reduced from 70 to 60
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

      <AnimatedView
        style={styles.drawerContent}
        entering={FadeIn.delay(500).duration(animations.duration.standard)}
      >
        {renderDrawerItems()}
      </AnimatedView>

      <Divider style={styles.divider} />

      <AnimatedView
        style={styles.footer}
        entering={FadeIn.delay(600).duration(animations.duration.standard)}
      >
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          © 2025 CRM App
        </Text>
      </AnimatedView>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    borderTopRightRadius: borderRadius.lg,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md, // Reduced from lg to md
    borderBottomRightRadius: borderRadius.lg,
    marginBottom: spacing.sm, // Reduced from xl to sm
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
    fontSize: 18, // Reduced from 20 to 18
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 12, // Reduced from 14 to 12
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  profileButton: {
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  drawerContent: {
    flex: 1,
    paddingTop: spacing.sm, // Reduced from lg to sm
  },
  topDivider: {
    marginBottom: spacing.xs, // Reduced from md to xs
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1,
  },
  divider: {
    marginVertical: spacing.md,
  },
  footer: {
    padding: spacing.md, // Reduced from lg to md
    paddingBottom: spacing.lg, // Keep bottom padding larger
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  // New styles for drawer items and submenus
  drawerItem: {
    paddingVertical: spacing.xs,
    marginVertical: 2,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
  },
  drawerLabel: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  submenuContainer: {
    marginLeft: spacing.lg,
    marginTop: -spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.03)', // Light background to distinguish submenu
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  submenuItem: {
    paddingVertical: spacing.xs,
    marginVertical: 1,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  submenuLabel: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '400',
  },
});

export default CustomDrawerContent;
