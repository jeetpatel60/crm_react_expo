import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import { ReportsStackParamList } from '../types';
import CustomerLedgerReportScreen from '../screens/CustomerLedgerReportScreen';
import FlatsAvailabilityReportScreen from '../screens/FlatsAvailabilityReportScreen';

const ReportsStack = createStackNavigator<ReportsStackParamList>();

const ReportsNavigator = () => {
  const theme = useTheme();

  return (
    <ReportsStack.Navigator
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
        name="CustomerLedgerReport"
        component={CustomerLedgerReportScreen}
        options={{ title: 'Customer Ledger Report' }}
      />
      <ReportsStack.Screen
        name="FlatsAvailabilityReport"
        component={FlatsAvailabilityReportScreen}
        options={{ title: 'Flats Availability Report' }}
      />
    </ReportsStack.Navigator>
  );
};

export default ReportsNavigator;
