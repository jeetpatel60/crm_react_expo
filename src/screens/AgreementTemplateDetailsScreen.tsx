import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, useTheme, IconButton, Menu, Divider } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { RootStackParamList, AgreementTemplate } from '../types';
import { getAgreementTemplateById, deleteAgreementTemplate } from '../database';
import { spacing, shadows } from '../constants/theme';
import { LoadingIndicator } from '../components';
import { confirmDelete } from '../utils/alertUtils';
import { generateAndShareTemplateDocument } from '../utils/templateUtils';

type AgreementTemplateDetailsRouteProp = RouteProp<RootStackParamList, 'AgreementTemplateDetails'>;
type AgreementTemplateDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const AgreementTemplateDetailsScreen: React.FC = () => {
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const theme = useTheme();
  const route = useRoute<AgreementTemplateDetailsRouteProp>();
  const navigation = useNavigation<AgreementTemplateDetailsNavigationProp>();
  const { templateId } = route.params;

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await getAgreementTemplateById(templateId);
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (template) {
      navigation.navigate('EditAgreementTemplate', { template });
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    if (template) {
      confirmDelete(
        'Delete Template',
        'Are you sure you want to delete this template? This action cannot be undone.',
        async () => {
          try {
            await deleteAgreementTemplate(template.id!);
            navigation.goBack();
          } catch (error) {
            console.error('Error deleting template:', error);
            Alert.alert('Error', 'Failed to delete template');
          }
        }
      );
    }
  };

  const handleExport = async (companyId?: number) => {
    setExportMenuVisible(false);
    if (template) {
      try {
        await generateAndShareTemplateDocument(
          template.id!,
          'agreement',
          undefined,
          undefined,
          undefined,
          undefined, // project company ID
          undefined, // specificPaymentRequestId
          undefined, // specificPaymentReceiptId
          companyId ? 'company' : 'none', // letterheadOption
          companyId // letterheadCompanyId
        );
      } catch (error) {
        console.error('Error exporting template:', error);
        Alert.alert('Error', 'Failed to export template');
      }
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!template) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Template not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View entering={FadeIn.duration(300)}>
        <Card style={[styles.card, shadows.md, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="titleLarge" style={styles.title}>
                {template.name}
              </Text>
              <View style={styles.actions}>
                <Button
                  mode="contained"
                  onPress={() => setExportMenuVisible(true)}
                  style={[styles.exportButton, { backgroundColor: theme.colors.primary }]}
                  icon="export"
                >
                  Export
                </Button>
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                  style={styles.menuButton}
                />
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={{ x: 0, y: 0 }}
                  style={styles.menu}
                >
                  <Menu.Item
                    onPress={handleEdit}
                    title="Edit Template"
                    leadingIcon="pencil"
                  />
                  <Divider />
                  <Menu.Item
                    onPress={handleDelete}
                    title="Delete Template"
                    leadingIcon="delete"
                  />
                </Menu>
                <Menu
                  visible={exportMenuVisible}
                  onDismiss={() => setExportMenuVisible(false)}
                  anchor={{ x: 0, y: 0 }}
                  style={styles.exportMenu}
                >
                  <Menu.Item
                    onPress={() => handleExport()}
                    title="Export without letterhead"
                    leadingIcon="file-document-outline"
                  />
                  <Divider />
                  <Menu.Item
                    onPress={() => handleExport(1)}
                    title="Export with Company 1 letterhead"
                    leadingIcon="office-building"
                  />
                  <Menu.Item
                    onPress={() => handleExport(2)}
                    title="Export with Company 2 letterhead"
                    leadingIcon="office-building"
                  />
                </Menu>
              </View>
            </View>

            <Text
              variant="bodySmall"
              style={[styles.date, { color: theme.colors.onSurfaceVariant }]}
            >
              Last updated: {new Date(template.updated_at || 0).toLocaleString()}
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.contentTitle}>
              Template Content:
            </Text>

            <Card style={[styles.contentCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Content>
                <Text style={styles.content}>{template.content}</Text>
              </Card.Content>
            </Card>
          </Card.Content>
        </Card>
      </Animated.View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportButton: {
    marginRight: spacing.xs,
  },
  menuButton: {
    margin: 0,
  },
  menu: {
    marginTop: 40,
    marginLeft: -100,
  },
  exportMenu: {
    marginTop: 40,
    marginLeft: -200,
  },
  date: {
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  contentTitle: {
    marginBottom: spacing.sm,
  },
  contentCard: {
    marginTop: spacing.xs,
  },
  content: {
    lineHeight: 20,
  },
});

export default AgreementTemplateDetailsScreen;
