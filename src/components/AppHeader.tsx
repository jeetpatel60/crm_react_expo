import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Appbar, useTheme, Menu, Divider, Text } from 'react-native-paper';
import { getHeaderTitle } from '@react-navigation/elements';
import { DrawerHeaderProps } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../constants/theme';
import { useThemeContext } from '../context';

interface AppHeaderProps extends DrawerHeaderProps {
  back?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const AppHeader = ({ navigation, route, back, options, title, subtitle, actions }: AppHeaderProps) => {
  const theme = useTheme();
  const { isDarkMode, themeMode } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = React.useState(false);

  // Log theme changes
  React.useEffect(() => {
    console.log('AppHeader - Theme mode:', themeMode);
    console.log('AppHeader - Is dark mode:', isDarkMode);
    console.log('AppHeader - StatusBar style:', isDarkMode ? 'light' : 'dark');
  }, [isDarkMode, themeMode]);

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
          <Appbar.BackAction
            onPress={navigation.goBack}
            color="#fff"
          />
        ) : (
          <Appbar.Action
            icon="menu"
            color="#fff"
            onPress={() => navigation.openDrawer()}
          />
        )}

        <View style={styles.titleContainer}>
          <Appbar.Content
            title={`${headerTitle} ${isDarkMode ? '🌙' : '☀️'}`}
            titleStyle={styles.title}
            color="#fff"
          />
          {subtitle && (
            <Text style={[styles.subtitle, { color: '#fff' }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {actions}

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              color="#fff"
              onPress={() => setMenuVisible(true)}
            />
          }
          contentStyle={{ backgroundColor: theme.colors.surface }}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // Handle profile action
            }}
            title="Profile"
            leadingIcon="account"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // Handle settings action
              navigation.navigate('Settings');
            }}
            title="Settings"
            leadingIcon="cog"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // Handle logout action
            }}
            title="Logout"
            leadingIcon="logout"
          />
        </Menu>
      </Appbar.Header>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
});

export default AppHeader;
