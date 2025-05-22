import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../constants/theme';

import { DrawerParamList } from '../types';
import DashboardScreen from '../screens/DashboardScreen';
import CompanyScreen from '../screens/CompanyScreen';
import LeadsScreen from '../screens/LeadsScreen';
import QuotationScreen from '../screens/QuotationScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import UnitsFlatScreen from '../screens/UnitsFlatScreen';
import ProjectSchedulesScreen from '../screens/ProjectSchedulesScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomDrawerContent from './CustomDrawerContent';
import ReportsNavigator from './ReportsNavigator';

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator = () => {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      detachInactiveScreens={true}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          letterSpacing: 0.5,
        },
        drawerType: 'slide',
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurface,
        drawerActiveBackgroundColor: theme.colors.primaryContainer + '40', // 25% opacity
        drawerLabelStyle: {
          marginLeft: spacing.sm,
          fontSize: 14,
          fontWeight: '500',
        },
        drawerItemStyle: {
          paddingVertical: spacing.md, // Increased for better touch area
          marginVertical: 3, // Increased for better spacing
          borderRadius: borderRadius.md,
          marginHorizontal: spacing.sm,
          minHeight: 48, // Ensure minimum touch target height
        },
        drawerStyle: {
          width: 300,
          borderTopRightRadius: borderRadius.lg,
          borderBottomRightRadius: borderRadius.lg,
          ...shadows.lg,
          overflow: 'hidden',
        },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Company"
        component={CompanyScreen}
        options={{
          title: 'Company',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="office-building" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Leads"
        component={LeadsScreen}
        options={{
          title: 'Leads',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-convert" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Quotation"
        component={QuotationScreen}
        options={{
          title: 'Quotation',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          title: 'Clients',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-tie" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          title: 'Projects',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="UnitsFlats"
        component={UnitsFlatScreen}
        options={{
          title: 'Units/Flats',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-city" color={color} size={size} />
          ),
        }}
      />
      {/* Project Schedules menu item hidden as requested */}

      <Drawer.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{
          title: 'Templates',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-multiple-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsNavigator}
        options={{
          title: 'Reports',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-chart" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
