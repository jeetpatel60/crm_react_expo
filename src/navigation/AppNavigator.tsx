import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

import { RootStackParamList } from '../types';
import DrawerNavigator from './DrawerNavigator';
import ContactDetailsScreen from '../screens/ContactDetailsScreen';
import AddContactScreen from '../screens/AddContactScreen';
import EditContactScreen from '../screens/EditContactScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import CompanyDetailsScreen from '../screens/CompanyDetailsScreen';
import AddCompanyScreen from '../screens/AddCompanyScreen';
import EditCompanyScreen from '../screens/EditCompanyScreen';
import ClientDetailsScreen from '../screens/ClientDetailsScreen';
import AddClientScreen from '../screens/AddClientScreen';
import EditClientScreen from '../screens/EditClientScreen';
import LeadDetailsScreen from '../screens/LeadDetailsScreen';
import AddLeadScreen from '../screens/AddLeadScreen';
import EditLeadScreen from '../screens/EditLeadScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const theme = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
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
        <Stack.Screen
          name="Home"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ContactDetails"
          component={ContactDetailsScreen}
          options={{ title: 'Contact Details' }}
        />
        <Stack.Screen
          name="AddContact"
          component={AddContactScreen}
          options={{ title: 'Add Contact' }}
        />
        <Stack.Screen
          name="EditContact"
          component={EditContactScreen}
          options={{ title: 'Edit Contact' }}
        />
        <Stack.Screen
          name="TaskDetails"
          component={TaskDetailsScreen}
          options={{ title: 'Task Details' }}
        />
        <Stack.Screen
          name="AddTask"
          component={AddTaskScreen}
          options={{ title: 'Add Task' }}
        />
        <Stack.Screen
          name="EditTask"
          component={EditTaskScreen}
          options={{ title: 'Edit Task' }}
        />
        <Stack.Screen
          name="CompanyDetails"
          component={CompanyDetailsScreen}
          options={{ title: 'Company Details' }}
        />
        <Stack.Screen
          name="AddCompany"
          component={AddCompanyScreen}
          options={{ title: 'Add Company' }}
        />
        <Stack.Screen
          name="EditCompany"
          component={EditCompanyScreen}
          options={{ title: 'Edit Company' }}
        />
        <Stack.Screen
          name="ClientDetails"
          component={ClientDetailsScreen}
          options={{ title: 'Client Details' }}
        />
        <Stack.Screen
          name="AddClient"
          component={AddClientScreen}
          options={{ title: 'Add Client' }}
        />
        <Stack.Screen
          name="EditClient"
          component={EditClientScreen}
          options={{ title: 'Edit Client' }}
        />
        <Stack.Screen
          name="LeadDetails"
          component={LeadDetailsScreen}
          options={{ title: 'Lead Details' }}
        />
        <Stack.Screen
          name="AddLead"
          component={AddLeadScreen}
          options={{ title: 'Add Lead' }}
        />
        <Stack.Screen
          name="EditLead"
          component={EditLeadScreen}
          options={{ title: 'Edit Lead' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
