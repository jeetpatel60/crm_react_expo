import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

import { RootStackParamList } from '../types';
import DrawerNavigator from './DrawerNavigator';
import CompanyDetailsScreen from '../screens/CompanyDetailsScreen';
import AddCompanyScreen from '../screens/AddCompanyScreen';
import EditCompanyScreen from '../screens/EditCompanyScreen';
import ClientDetailsScreen from '../screens/ClientDetailsScreen';
import AddClientScreen from '../screens/AddClientScreen';
import EditClientScreen from '../screens/EditClientScreen';
import LeadDetailsScreen from '../screens/LeadDetailsScreen';
import AddLeadScreen from '../screens/AddLeadScreen';
import EditLeadScreen from '../screens/EditLeadScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import EditProjectScreen from '../screens/EditProjectScreen';
import ProjectScheduleDetailsScreen from '../screens/ProjectScheduleDetailsScreen';
import AddProjectScheduleScreen from '../screens/AddProjectScheduleScreen';
import EditProjectScheduleScreen from '../screens/EditProjectScheduleScreen';
import AddMilestoneScreen from '../screens/AddMilestoneScreen';
import EditMilestoneScreen from '../screens/EditMilestoneScreen';
import TestMilestoneEditScreen from '../screens/TestMilestoneEditScreen';
import UnitFlatDetailsScreen from '../screens/UnitFlatDetailsScreen';
import AddUnitFlatScreen from '../screens/AddUnitFlatScreen';
import EditUnitFlatScreen from '../screens/EditUnitFlatScreen';
import AddUnitCustomerScheduleScreen from '../screens/AddUnitCustomerScheduleScreen';
import EditUnitCustomerScheduleScreen from '../screens/EditUnitCustomerScheduleScreen';
import AddUnitPaymentRequestScreen from '../screens/AddUnitPaymentRequestScreen';
import EditUnitPaymentRequestScreen from '../screens/EditUnitPaymentRequestScreen';
import AddUnitPaymentReceiptScreen from '../screens/AddUnitPaymentReceiptScreen';
import EditUnitPaymentReceiptScreen from '../screens/EditUnitPaymentReceiptScreen';
import QuotationDetailsScreen from '../screens/QuotationDetailsScreen';
import AddQuotationScreen from '../screens/AddQuotationScreen';
import EditQuotationScreen from '../screens/EditQuotationScreen';
import AgreementTemplateDetailsScreen from '../screens/AgreementTemplateDetailsScreen';
import AddAgreementTemplateScreen from '../screens/AddAgreementTemplateScreen';
import EditAgreementTemplateScreen from '../screens/EditAgreementTemplateScreen';
import PaymentRequestTemplateDetailsScreen from '../screens/PaymentRequestTemplateDetailsScreen';
import AddPaymentRequestTemplateScreen from '../screens/AddPaymentRequestTemplateScreen';
import EditPaymentRequestTemplateScreen from '../screens/EditPaymentRequestTemplateScreen';
import PaymentReceiptTemplatesScreen from '../screens/PaymentReceiptTemplatesScreen'; // Added
import PaymentReceiptTemplateDetailsScreen from '../screens/PaymentReceiptTemplateDetailsScreen'; // Added
import AddPaymentReceiptTemplateScreen from '../screens/AddPaymentReceiptTemplateScreen'; // Added
import EditPaymentReceiptTemplateScreen from '../screens/EditPaymentReceiptTemplateScreen'; // Added

import BackupManagementScreen from '../screens/BackupManagementScreen';
import HowToUseGuideScreen from '../screens/HowToUseGuideScreen';

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
        <Stack.Screen
          name="ProjectDetails"
          component={ProjectDetailsScreen}
          options={{ title: 'Project Details' }}
        />
        <Stack.Screen
          name="AddProject"
          component={AddProjectScreen}
          options={{ title: 'Add Project' }}
        />
        <Stack.Screen
          name="EditProject"
          component={EditProjectScreen}
          options={{ title: 'Edit Project' }}
        />
        <Stack.Screen
          name="ProjectScheduleDetails"
          component={ProjectScheduleDetailsScreen}
          options={{ title: 'Schedule Details' }}
        />
        <Stack.Screen
          name="AddProjectSchedule"
          component={AddProjectScheduleScreen}
          options={{ title: 'Add Schedule' }}
        />
        <Stack.Screen
          name="EditProjectSchedule"
          component={EditProjectScheduleScreen}
          options={{ title: 'Edit Schedule' }}
        />
        <Stack.Screen
          name="AddMilestone"
          component={AddMilestoneScreen}
          options={{ title: 'Add Milestone' }}
        />
        <Stack.Screen
          name="EditMilestone"
          component={EditMilestoneScreen}
          options={{ title: 'Edit Milestone' }}
        />
        <Stack.Screen
          name="TestMilestoneEdit"
          component={TestMilestoneEditScreen}
          options={{ title: 'Test Milestone Edit' }}
        />
        <Stack.Screen
          name="UnitFlatDetails"
          component={UnitFlatDetailsScreen}
          options={{ title: 'Unit/Flat Details' }}
        />
        <Stack.Screen
          name="AddUnitFlat"
          component={AddUnitFlatScreen}
          options={{ title: 'Add Unit/Flat' }}
        />
        <Stack.Screen
          name="EditUnitFlat"
          component={EditUnitFlatScreen}
          options={{ title: 'Edit Unit/Flat' }}
        />
        <Stack.Screen
          name="AddUnitCustomerSchedule"
          component={AddUnitCustomerScheduleScreen}
          options={{ title: 'Add Customer Schedule' }}
        />
        <Stack.Screen
          name="EditUnitCustomerSchedule"
          component={EditUnitCustomerScheduleScreen}
          options={{ title: 'Edit Customer Schedule' }}
        />
        <Stack.Screen
          name="AddUnitPaymentRequest"
          component={AddUnitPaymentRequestScreen}
          options={{ title: 'Add Payment Request' }}
        />
        <Stack.Screen
          name="EditUnitPaymentRequest"
          component={EditUnitPaymentRequestScreen}
          options={{ title: 'Edit Payment Request' }}
        />
        <Stack.Screen
          name="AddUnitPaymentReceipt"
          component={AddUnitPaymentReceiptScreen}
          options={{ title: 'Add Payment Receipt' }}
        />
        <Stack.Screen
          name="EditUnitPaymentReceipt"
          component={EditUnitPaymentReceiptScreen}
          options={{ title: 'Edit Payment Receipt' }}
        />
        <Stack.Screen
          name="QuotationDetails"
          component={QuotationDetailsScreen}
          options={{ title: 'Quotation Details' }}
        />
        <Stack.Screen
          name="AddQuotation"
          component={AddQuotationScreen}
          options={{ title: 'Add Quotation' }}
        />
        <Stack.Screen
          name="EditQuotation"
          component={EditQuotationScreen}
          options={{ title: 'Edit Quotation' }}
        />
        <Stack.Screen
          name="AgreementTemplateDetails"
          component={AgreementTemplateDetailsScreen}
          options={{ title: 'Agreement Template' }}
        />
        <Stack.Screen
          name="AddAgreementTemplate"
          component={AddAgreementTemplateScreen}
          options={{ title: 'Add Agreement Template' }}
        />
        <Stack.Screen
          name="EditAgreementTemplate"
          component={EditAgreementTemplateScreen}
          options={{ title: 'Edit Agreement Template' }}
        />
        <Stack.Screen
          name="PaymentRequestTemplateDetails"
          component={PaymentRequestTemplateDetailsScreen}
          options={{ title: 'Payment Request Template' }}
        />
        <Stack.Screen
          name="AddPaymentRequestTemplate"
          component={AddPaymentRequestTemplateScreen}
          options={{ title: 'Add Payment Request Template' }}
        />
        <Stack.Screen
          name="EditPaymentRequestTemplate"
          component={EditPaymentRequestTemplateScreen}
          options={{ title: 'Edit Payment Request Template' }}
        />
        {/* Payment Receipt Template Screens */}
        <Stack.Screen
          name="PaymentReceiptTemplates"
          component={PaymentReceiptTemplatesScreen}
          options={{ title: 'Payment Receipt Templates' }}
        />
        <Stack.Screen
          name="PaymentReceiptTemplateDetails"
          component={PaymentReceiptTemplateDetailsScreen}
          options={{ title: 'Payment Receipt Template' }}
        />
        <Stack.Screen
          name="AddPaymentReceiptTemplate"
          component={AddPaymentReceiptTemplateScreen}
          options={{ title: 'Add Payment Receipt Template' }}
        />
        <Stack.Screen
          name="EditPaymentReceiptTemplate"
          component={EditPaymentReceiptTemplateScreen}
          options={{ title: 'Edit Payment Receipt Template' }}
        />

        <Stack.Screen
          name="BackupManagement"
          component={BackupManagementScreen}
          options={{ title: 'Backup & Restore' }}
        />
        <Stack.Screen
          name="HowToUseGuide"
          component={HowToUseGuideScreen}
          options={{ title: 'How to Use' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
