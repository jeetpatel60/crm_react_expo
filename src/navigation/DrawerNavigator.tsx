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
import ClientsScreen from '../screens/ClientsScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import UnitsFlatScreen from '../screens/UnitsFlatScreen';
import ProjectSchedulesScreen from '../screens/ProjectSchedulesScreen';
import ContactsScreen from '../screens/ContactsScreen';
import TasksScreen from '../screens/TasksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator = () => {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
          marginLeft: spacing.sm, // Reduced from md to sm
          fontSize: 14, // Reduced from 15 to 14
          fontWeight: '500',
        },
        drawerItemStyle: {
          paddingVertical: spacing.xs, // Reduced back to xs
          marginVertical: 2, // Reduced to a fixed small value
          borderRadius: borderRadius.md,
          marginHorizontal: spacing.sm,
        },
        drawerStyle: {
          width: 300,
          borderTopRightRadius: borderRadius.lg,
          borderBottomRightRadius: borderRadius.lg,
          ...shadows.lg,
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
      <Drawer.Screen
        name="ProjectSchedules"
        component={ProjectSchedulesScreen}
        options={{
          title: 'Project Schedules',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: 'Contacts',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tasks',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="checkbox-marked-outline" color={color} size={size} />
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
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
