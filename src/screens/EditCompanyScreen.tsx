import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system';

import { RootStackParamList } from '../types';
import { Company } from '../database/companiesDb';
import { updateCompany } from '../database';
import { spacing } from '../constants/theme';
import { pickDocument, saveFile, deleteFile, FileInfo } from '../utils/fileUtils';

type EditCompanyRouteProp = RouteProp<RootStackParamList, 'EditCompany'>;
type EditCompanyNavigationProp = StackNavigationProp<RootStackParamList>;

const EditCompanyScreen = () => {
  const theme = useTheme();
  const route = useRoute<EditCompanyRouteProp>();
  const navigation = useNavigation<EditCompanyNavigationProp>();
  const { company } = route.params;

  const [name, setName] = useState(company.name);
  const [salutation, setSalutation] = useState(company.salutation || '');
  const [letterheadPath, setLetterheadPath] = useState(company.letterhead_path);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fileExists, setFileExists] = useState(false);

  useEffect(() => {
    const checkFile = async () => {
      if (letterheadPath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(letterheadPath);
          setFileExists(fileInfo.exists);
        } catch (error) {
          console.error('Error checking file:', error);
          setFileExists(false);
        }
      }
    };

    checkFile();
  }, [letterheadPath]);

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

      // Handle file changes
      let newLetterheadPath = letterheadPath;
      
      // If a new file is selected, save it and delete the old one
      if (selectedFile) {
        // Delete old file if it exists
        if (letterheadPath && fileExists) {
          await deleteFile(letterheadPath);
        }
        
        // Save new file
        newLetterheadPath = await saveFile(selectedFile);
      }

      const updatedCompany: Company = {
        ...company,
        name,
        salutation: salutation || undefined,
        letterhead_path: newLetterheadPath,
      };

      await updateCompany(updatedCompany);

      Alert.alert('Success', 'Company updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating company:', error);
      Alert.alert('Error', 'Failed to update company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLetterhead = async () => {
    if (letterheadPath && fileExists) {
      try {
        await deleteFile(letterheadPath);
        setLetterheadPath(undefined);
        setFileExists(false);
        Alert.alert('Success', 'Letterhead deleted successfully');
      } catch (error) {
        console.error('Error deleting letterhead:', error);
        Alert.alert('Error', 'Failed to delete letterhead. Please try again.');
      }
    }
  };

  const getFileName = (path?: string) => {
    if (!path) return '';
    return path.split('/').pop() || 'file';
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
        
        {letterheadPath && fileExists && !selectedFile ? (
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileName}>{getFileName(letterheadPath)}</Text>
            <View style={styles.fileActions}>
              <Button
                mode="outlined"
                onPress={handlePickDocument}
                style={[styles.fileButton, { marginRight: spacing.sm }]}
                icon="file-upload"
              >
                Change
              </Button>
              <Button
                mode="outlined"
                onPress={handleDeleteLetterhead}
                style={styles.fileButton}
                icon="delete"
                textColor={theme.colors.error}
              >
                Delete
              </Button>
            </View>
          </View>
        ) : (
          <Button
            mode="outlined"
            onPress={handlePickDocument}
            style={styles.fileButton}
            icon="file-upload"
          >
            {selectedFile ? 'Change File' : 'Select File'}
          </Button>
        )}

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
          Update Company
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
  fileActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
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

export default EditCompanyScreen;
