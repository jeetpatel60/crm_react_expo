import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Appbar, useTheme, Menu, Divider, Text } from 'react-native-paper';
import { getHeaderTitle } from '@react-navigation/elements';
import { DrawerHeaderProps } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { spacing, shadows, animations, borderRadius } from '../constants/theme';
import { useThemeContext } from '../context';
import { usePressAnimation } from '../utils/animationUtils';

interface AppHeaderProps extends DrawerHeaderProps {
  back?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const AnimatedAppbarAction = Animated.createAnimatedComponent(Appbar.Action);
const AnimatedAppbarBackAction = Animated.createAnimatedComponent(Appbar.BackAction);

const AppHeader = ({ navigation, route, back, options, title, subtitle, actions }: AppHeaderProps) => {
  const theme = useTheme();
  const { isDarkMode, themeMode } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuButtonPressed, setMenuButtonPressed] = useState(false);
  const [backButtonPressed, setBackButtonPressed] = useState(false);

  // Animation styles
  const menuButtonStyle = usePressAnimation(menuButtonPressed);
  const backButtonStyle = usePressAnimation(backButtonPressed);

  const headerTitle = title || getHeaderTitle(options, route.name);

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Appbar.Header
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
            paddingTop: Platform.OS === 'ios' ? insets.top : 0,
            height: Platform.OS === 'ios' ? 96 + insets.top : 64,
          },
        ]}
      >
        {back ? (
          <Pressable
            onPressIn={() => setBackButtonPressed(true)}
            onPressOut={() => setBackButtonPressed(false)}
            onPress={navigation.goBack}
          >
            <AnimatedAppbarBackAction
              color="#fff"
              style={backButtonStyle}
            />
          </Pressable>
        ) : (
          <Pressable
            onPressIn={() => setMenuButtonPressed(true)}
            onPressOut={() => setMenuButtonPressed(false)}
            onPress={() => navigation.openDrawer()}
          >
            <AnimatedAppbarAction
              icon="menu"
              color="#fff"
              style={menuButtonStyle}
            />
          </Pressable>
        )}

        <Animated.View
          style={styles.titleContainer}
          entering={FadeIn.duration(animations.duration.standard)}
        >
          <Appbar.Content
            title={headerTitle}
            titleStyle={styles.title}
            color="#fff"
          />
          {subtitle && (
            <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              {subtitle}
            </Text>
          )}
        </Animated.View>

        {actions}

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              color="#fff"
              onPress={() => setMenuVisible(true)}
              style={styles.menuButton}
            />
          }
          contentStyle={[
            { backgroundColor: theme.colors.surface },
            styles.menuContent,
            shadows.lg
          ]}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // Handle profile action
            }}
            title="Profile"
            leadingIcon="account"
            titleStyle={styles.menuItemTitle}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // Handle settings action
              navigation.navigate('Settings');
            }}
            title="Settings"
            leadingIcon="cog"
            titleStyle={styles.menuItemTitle}
          />
          <Divider style={styles.menuDivider} />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // Handle logout action
            }}
            title="Logout"
            leadingIcon="logout"
            titleStyle={styles.menuItemTitle}
          />
        </Menu>
      </Appbar.Header>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  menuButton: {
    marginLeft: 0,
  },
  menuContent: {
    borderRadius: 12,
    marginTop: 8,
  },
  menuItemTitle: {
    fontSize: 16,
  },
  menuDivider: {
    marginVertical: 8,
  },
});

export default AppHeader;
