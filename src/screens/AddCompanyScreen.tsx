import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Company } from '../database/companiesDb';
import { addCompany } from '../database';
import { spacing } from '../constants/theme';
import { pickDocument, saveFile, FileInfo } from '../utils/fileUtils';

type AddCompanyNavigationProp = StackNavigationProp<RootStackParamList>;

const AddCompanyScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddCompanyNavigationProp>();

  const [name, setName] = useState('');
  const [salutation, setSalutation] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickDocument = async () => {
    const file = await pickDocument();
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Save file if selected
      let letterheadPath: string | undefined;
      if (selectedFile) {
        letterheadPath = await saveFile(selectedFile);
      }

      const newCompany: Company = {
        name,
        salutation: salutation || undefined,
        letterhead_path: letterheadPath,
      };

      await addCompany(newCompany);

      Alert.alert('Success', 'Company added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding company:', error);
      Alert.alert('Error', 'Failed to add company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Company Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.name && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.name}
          </Text>
        )}

        <TextInput
          label="Company Salutation"
          value={salutation}
          onChangeText={setSalutation}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <Text style={styles.sectionTitle}>Company Letterhead</Text>
        <Button
          mode="outlined"
          onPress={handlePickDocument}
          style={styles.fileButton}
          icon="file-upload"
        >
          {selectedFile ? 'Change File' : 'Select File'}
        </Button>

        {selectedFile && (
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              {(selectedFile.size / 1024).toFixed(2)} KB
            </Text>
            {selectedFile.mimeType.startsWith('image/') && (
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            )}
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          loading={loading}
          disabled={loading}
        >
          Add Company
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fileButton: {
    marginBottom: spacing.md,
  },
  fileInfoContainer: {
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  fileName: {
    fontWeight: '500',
  },
  fileSize: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginTop: spacing.sm,
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});

export default AddCompanyScreen;
