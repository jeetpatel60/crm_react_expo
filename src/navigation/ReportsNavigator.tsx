import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import { ReportsStackParamList } from '../types';
import CustomerLedgerReportScreen from '../screens/CustomerLedgerReportScreen';
import FlatsAvailabilityReportScreen from '../screens/FlatsAvailabilityReportScreen';
import GstReportScreen from '../screens/GstReportScreen';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ReportsStack = createStackNavigator<ReportsStackParamList>();

// Create a simple landing screen for Reports
const ReportsLandingScreen = ({ navigation }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="file-chart"
          size={60}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: theme.colors.primary }]}>Reports</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Please select a report type from the menu
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

const ReportsNavigator = () => {
  const theme = useTheme();

  return (
    <ReportsStack.Navigator
      initialRouteName="ReportsLanding"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ReportsStack.Screen
        name="ReportsLanding"
        component={ReportsLandingScreen}
        options={{ title: 'Reports' }}
      />
      <ReportsStack.Screen
        name="CustomerLedgerReport"
        component={CustomerLedgerReportScreen}
        options={{ title: 'Customer Ledger Report' }}
      />
      <ReportsStack.Screen
        name="FlatsAvailabilityReport"
        component={FlatsAvailabilityReportScreen}
        options={{ title: 'Flats Availability Report' }}
      />
      <ReportsStack.Screen
        name="GstReport"
        component={GstReportScreen}
        options={{ title: 'GST Report' }}
      />
    </ReportsStack.Navigator>
  );
};

export default ReportsNavigator;
