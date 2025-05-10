import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Card, Text, Button, useTheme, Divider, IconButton } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { Company } from '../database/companiesDb';
import { getCompanyById, deleteCompany } from '../database';
import { spacing } from '../constants/theme';
import { shadows } from '../constants/theme';

type CompanyDetailsRouteProp = RouteProp<RootStackParamList, 'CompanyDetails'>;
type CompanyDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const CompanyDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<CompanyDetailsRouteProp>();
  const navigation = useNavigation<CompanyDetailsNavigationProp>();
  const { companyId } = route.params;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileExists, setFileExists] = useState(false);
  const [fileType, setFileType] = useState<string>('');

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await getCompanyById(companyId);
      setCompany(data);

      // Check if letterhead file exists
      if (data.letterhead_path) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(data.letterhead_path);
          setFileExists(fileInfo.exists);
          
          // Determine file type
          const extension = data.letterhead_path.split('.').pop()?.toLowerCase() || '';
          if (['jpg', 'jpeg', 'png'].includes(extension)) {
            setFileType('image');
          } else if (extension === 'pdf') {
            setFileType('pdf');
          } else {
            setFileType('other');
          }
        } catch (error) {
          console.error('Error checking file:', error);
          setFileExists(false);
        }
      }
    } catch (error) {
      console.error('Error loading company:', error);
      Alert.alert('Error', 'Failed to load company details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (company) {
      navigation.navigate('EditCompany', { company });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Company',
      'Are you sure you want to delete this company? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (company?.id) {
                await deleteCompany(company.id);
                Alert.alert('Success', 'Company deleted successfully');
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting company:', error);
              Alert.alert('Error', 'Failed to delete company. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getFileName = (path?: string) => {
    if (!path) return '';
    return path.split('/').pop() || 'file';
  };

  if (loading || !company) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, shadows.md, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.headerContainer}>
              <View style={styles.headerContent}>
                <Text variant="headlineSmall" style={styles.companyName}>
                  {company.name}
                </Text>
                <View style={styles.headerActions}>
                  <IconButton
                    icon="pencil"
                    size={24}
                    iconColor={theme.colors.secondary}
                    onPress={handleEdit}
                  />
                  <IconButton
                    icon="delete"
                    size={24}
                    iconColor={theme.colors.error}
                    onPress={handleDelete}
                  />
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Company Salutation
            </Text>
            {company.salutation ? (
              <Text variant="bodyMedium" style={styles.salutation}>
                {company.salutation}
              </Text>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No salutation provided
              </Text>
            )}

            <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              Company Letterhead
            </Text>
            {company.letterhead_path && fileExists ? (
              <View style={styles.letterheadContainer}>
                <View style={styles.fileInfoRow}>
                  <MaterialCommunityIcons
                    name={fileType === 'image' ? 'file-image' : fileType === 'pdf' ? 'file-pdf' : 'file-document'}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text variant="bodyMedium" style={styles.fileName}>
                    {getFileName(company.letterhead_path)}
                  </Text>
                </View>
                
                {fileType === 'image' && (
                  <Image
                    source={{ uri: company.letterhead_path }}
                    style={styles.letterheadImage}
                    resizeMode="contain"
                  />
                )}
                
                {fileType === 'pdf' && (
                  <View style={styles.pdfPlaceholder}>
                    <MaterialCommunityIcons name="file-pdf-box" size={48} color={theme.colors.primary} />
                    <Text variant="bodyMedium">PDF Document</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No letterhead attached
              </Text>
            )}
          </Card.Content>
        </Card>
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
  card: {
    marginBottom: spacing.md,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontWeight: 'bold',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  salutation: {
    lineHeight: 22,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#888',
  },
  letterheadContainer: {
    marginTop: spacing.sm,
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fileName: {
    marginLeft: spacing.sm,
  },
  letterheadImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  pdfPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CompanyDetailsScreen;
