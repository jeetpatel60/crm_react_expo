import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, Card } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, PaymentReceiptTemplate } from '../types';
import { updatePaymentReceiptTemplate } from '../database';
import { spacing, shadows } from '../constants/theme';

type EditPaymentReceiptTemplateRouteProp = RouteProp<RootStackParamList, 'EditPaymentReceiptTemplate'>;
type EditPaymentReceiptTemplateNavigationProp = StackNavigationProp<RootStackParamList>;

const EditPaymentReceiptTemplateScreen: React.FC = () => {
  const route = useRoute<EditPaymentReceiptTemplateRouteProp>();
  const { template } = route.params;

  const [name, setName] = useState(template.name);
  const [content, setContent] = useState(template.content);
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<EditPaymentReceiptTemplateNavigationProp>();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter template content');
      return;
    }

    try {
      setSubmitting(true);
      await updatePaymentReceiptTemplate({
        id: template.id,
        name: name.trim(),
        content: content.trim(),
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error updating payment receipt template:', error);
      Alert.alert('Error', 'Failed to update template. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Card style={[styles.card, shadows.md, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <TextInput
            label="Template Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          <Text style={[styles.helpText, { color: theme.colors.onSurfaceVariant }]}>
            Use placeholders like {"{{CLIENT_NAME}}"}, {"{{FLAT_NO}}"}, etc. in your template content.
            These will be replaced with actual data when generating documents.
          </Text>

          <TextInput
            label="Template Content"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            multiline
            numberOfLines={15}
            style={[styles.input, styles.contentInput]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          <Text style={[styles.placeholdersTitle, { color: theme.colors.onSurface }]}>
            Available Placeholders:
          </Text>

          <View style={styles.placeholdersContainer}>
            <View style={styles.placeholderColumn}>
              <Text style={styles.placeholderCategory}>Client</Text>
              <Text style={styles.placeholder}>{"{{CLIENT_NAME}}"}</Text>
              <Text style={styles.placeholder}>{"{{CLIENT_ADDRESS}}"}</Text>
              <Text style={styles.placeholder}>{"{{CLIENT_PAN}}"}</Text>
              <Text style={styles.placeholder}>{"{{CLIENT_GSTIN}}"}</Text>
              <Text style={styles.placeholder}>{"{{CLIENT_CONTACT}}"}</Text>
              <Text style={styles.placeholder}>{"{{CLIENT_EMAIL}}"}</Text>
            </View>

            <View style={styles.placeholderColumn}>
              <Text style={styles.placeholderCategory}>Unit/Flat</Text>
              <Text style={styles.placeholder}>{"{{FLAT_NO}}"}</Text>
              <Text style={styles.placeholder}>{"{{AREA_SQFT}}"}</Text>
              <Text style={styles.placeholder}>{"{{RATE_PER_SQFT}}"}</Text>
              <Text style={styles.placeholder}>{"{{FLAT_VALUE}}"}</Text>
              <Text style={styles.placeholder}>{"{{RECEIVED_AMOUNT}}"}</Text>
              <Text style={styles.placeholder}>{"{{BALANCE_AMOUNT}}"}</Text>
              <Text style={styles.placeholder}>{"{{FLAT_TYPE}}"}</Text>
            </View>

            <View style={styles.placeholderColumn}>
              <Text style={styles.placeholderCategory}>Project</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_NAME}}"}</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_ADDRESS}}"}</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_START_DATE}}"}</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_END_DATE}}"}</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_PROGRESS}}"}</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_BUDGET}}"}</Text>
            </View>

            <View style={styles.placeholderColumn}>
              <Text style={styles.placeholderCategory}>Company</Text>
              <Text style={styles.placeholder}>{"{{COMPANY_NAME}}"}</Text>
              <Text style={styles.placeholder}>{"{{COMPANY_SALUTATION}}"}</Text>

              <Text style={styles.placeholderCategory}>Other</Text>
              <Text style={styles.placeholder}>{"{{CURRENT_DATE}}"}</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Complete Tables</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_MILESTONES_TABLE}}"} - Inserts project milestones table</Text>
              <Text style={styles.placeholder}>{"{{CUSTOMER_SCHEDULES_TABLE}}"} - Inserts customer schedules table</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUESTS_TABLE}}"} - Inserts payment requests table</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPTS_TABLE}}"} - Inserts payment receipts table</Text>
              <Text style={styles.placeholder}>{"{{PENDING_PAYMENTS_TABLE}}"} - Inserts pending payments table</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Project Milestones Fields (use with index, e.g. 0 for first milestone)</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_MILESTONE_SR_NO[index]}}"} - Sr No of milestone at index</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_MILESTONE_NAME[index]}}"} - Name of milestone at index</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_MILESTONE_COMPLETION[index]}}"} - Completion % of milestone at index</Text>
              <Text style={styles.placeholder}>{"{{PROJECT_MILESTONE_STATUS[index]}}"} - Status of milestone at index</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Customer Schedules Fields (use with index, e.g. 0 for first schedule)</Text>
              <Text style={styles.placeholder}>{"{{CUSTOMER_SCHEDULE_SR_NO[index]}}"} - Sr No of schedule at index</Text>
              <Text style={styles.placeholder}>{"{{CUSTOMER_SCHEDULE_MILESTONE[index]}}"} - Milestone of schedule at index</Text>
              <Text style={styles.placeholder}>{"{{CUSTOMER_SCHEDULE_COMPLETION[index]}}"} - Completion % of schedule at index</Text>
              <Text style={styles.placeholder}>{"{{CUSTOMER_SCHEDULE_AMOUNT[index]}}"} - Amount of schedule at index</Text>
              <Text style={styles.placeholder}>{"{{CUSTOMER_SCHEDULE_STATUS[index]}}"} - Status of schedule at index</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Current Payment Request Fields (for specific payment request export)</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_SR_NO}}"} - Sr No of the current payment request</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_DATE}}"} - Date of the current payment request</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_DESCRIPTION}}"} - Description of the current payment request</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_AMOUNT}}"} - Amount of the current payment request</Text>
              <Text style={styles.placeholder}>{"{{AMOUNT}}"} - Shorthand for amount of the current payment request</Text>
              <Text style={styles.placeholder}>{"{{DATE}}"} - Shorthand for date of the current payment request</Text>
              <Text style={styles.placeholder}>{"{{DESCRIPTION}}"} - Shorthand for description of the current payment request</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Payment Requests Fields (use with index, e.g. 0 for first request)</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_SR_NO[index]}}"} - Sr No of request at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_DATE[index]}}"} - Date of request at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_DESCRIPTION[index]}}"} - Description of request at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUEST_AMOUNT[index]}}"} - Amount of request at index</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Current Payment Receipt Fields (for specific payment receipt export)</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_SR_NO}}"} - Sr No of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_DATE}}"} - Date of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_DESCRIPTION}}"} - Description of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_AMOUNT}}"} - Amount of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_MODE}}"} - Mode of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_REMARKS}}"} - Remarks of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{AMOUNT}}"} - Shorthand for amount of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{DATE}}"} - Shorthand for date of the current payment receipt</Text>
              <Text style={styles.placeholder}>{"{{DESCRIPTION}}"} - Shorthand for description of the current payment receipt</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Payment Receipts Fields (use with index, e.g. 0 for first receipt)</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_SR_NO[index]}}"} - Sr No of receipt at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_DATE[index]}}"} - Date of receipt at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_DESCRIPTION[index]}}"} - Description of receipt at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_AMOUNT[index]}}"} - Amount of receipt at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_MODE[index]}}"} - Mode of receipt at index</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPT_REMARKS[index]}}"} - Remarks of receipt at index</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Pending Payments Fields (use with index, e.g. 0 for first pending payment)</Text>
              <Text style={styles.placeholder}>{"{{PENDING_PAYMENT_SR_NO[index]}}"} - Sr No of pending payment at index</Text>
              <Text style={styles.placeholder}>{"{{PENDING_PAYMENT_DATE[index]}}"} - Date of pending payment at index</Text>
              <Text style={styles.placeholder}>{"{{PENDING_PAYMENT_DESCRIPTION[index]}}"} - Description of pending payment at index</Text>
              <Text style={styles.placeholder}>{"{{PENDING_PAYMENT_AMOUNT[index]}}"} - Amount of pending payment at index</Text>
            </View>

            <View style={[styles.placeholderColumn, { width: '100%' }]}>
              <Text style={styles.placeholderCategory}>Aggregated Values</Text>
              <Text style={styles.placeholder}>{"{{TOTAL_PAYMENT_REQUESTS_AMOUNT}}"} - Total amount of all payment requests</Text>
              <Text style={styles.placeholder}>{"{{TOTAL_PAYMENT_RECEIPTS_AMOUNT}}"} - Total amount of all payment receipts</Text>
              <Text style={styles.placeholder}>{"{{TOTAL_PENDING_PAYMENTS_AMOUNT}}"} - Total amount of all pending payments</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_REQUESTS_COUNT}}"} - Number of payment requests</Text>
              <Text style={styles.placeholder}>{"{{PAYMENT_RECEIPTS_COUNT}}"} - Number of payment receipts</Text>
              <Text style={styles.placeholder}>{"{{PENDING_PAYMENTS_COUNT}}"} - Number of pending payments</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          loading={submitting}
          disabled={submitting}
        >
          Update Template
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  contentInput: {
    minHeight: 200,
  },
  helpText: {
    marginBottom: spacing.md,
    fontSize: 14,
    fontStyle: 'italic',
  },
  placeholdersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  placeholdersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  placeholderColumn: {
    width: '50%',
    marginBottom: spacing.md,
  },
  placeholderCategory: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  placeholder: {
    fontSize: 12,
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: spacing.sm,
  },
  button: {
    padding: spacing.xs,
  },
});

export default EditPaymentReceiptTemplateScreen;
