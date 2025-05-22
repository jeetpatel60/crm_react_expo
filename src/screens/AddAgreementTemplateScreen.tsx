import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { addAgreementTemplate } from '../database';
import { spacing, shadows } from '../constants/theme';

type AddAgreementTemplateNavigationProp = StackNavigationProp<RootStackParamList>;

const AddAgreementTemplateScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<AddAgreementTemplateNavigationProp>();

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
      await addAgreementTemplate({
        name: name.trim(),
        content: content.trim(),
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error adding agreement template:', error);
      Alert.alert('Error', 'Failed to add template. Please try again.');
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
          </View>

          <Text style={[styles.placeholdersTitle, { color: theme.colors.onSurface, marginTop: spacing.md }]}>
            Formatting Rules:
          </Text>
          <View style={styles.formattingContainer}>
            <Text style={styles.formattingRule}>
              <Text style={{ fontWeight: 'bold' }}>Headings:</Text> Use `#` for Heading 1, `##` for Heading 2, `###` for Heading 3.
            </Text>
            <Text style={styles.formattingExample}>
              Example: `# Main Title`, `## Section Title`, `### Sub-section`
            </Text>
            <Text style={styles.formattingRule}>
              <Text style={{ fontWeight: 'bold' }}>Paragraphs:</Text> Use a blank line (double line break) to separate paragraphs.
            </Text>
            <Text style={styles.formattingExample}>
              Example: {"Line 1 of paragraph.\n\nLine 1 of new paragraph."}
            </Text>
            <Text style={styles.formattingRule}>
              <Text style={{ fontWeight: 'bold' }}>Line Breaks:</Text> Use a single line break for a new line within the same paragraph.
            </Text>
            <Text style={styles.formattingExample}>
              Example: {"Line 1 of text.\nLine 2 of text."}
            </Text>
            <Text style={styles.formattingRule}>
              <Text style={{ fontWeight: 'bold' }}>Center Alignment:</Text> Wrap content with `~center~` and `~/center~` tags.
            </Text>
            <Text style={styles.formattingExample}>
              Example: `~center~This text will be centered.~/center~`
            </Text>
            <Text style={styles.formattingRule}>
              <Text style={{ fontWeight: 'bold' }}>Right Alignment:</Text> Wrap content with `~right~` and `~/right~` tags.
            </Text>
            <Text style={styles.formattingExample}>
              Example: `~right~This text will be right-aligned.~/right~`
            </Text>
            <Text style={styles.formattingRule}>
              <Text style={{ fontWeight: 'bold' }}>Left Alignment:</Text> Wrap content with `~left~` and `~/left~` tags.
            </Text>
            <Text style={styles.formattingExample}>
              Example: `~left~This text will be left-aligned.~/left~`
            </Text>
            <Text style={styles.formattingRule}>
              <Text style={{ fontWeight: 'bold' }}>Combinations:</Text> Formatting rules can be combined. For example, a heading can be centered.
            </Text>
            <Text style={styles.formattingExample}>
              Example: `~center~# Centered Heading 1~/center~`
            </Text>
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
          Save Template
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
  formattingContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#f9f9f9', // A light background to distinguish it
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  formattingRule: {
    fontSize: 14,
    marginBottom: spacing.xs / 2,
    lineHeight: 20,
  },
  formattingExample: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm, // Indent examples slightly
  },
});

export default AddAgreementTemplateScreen;
