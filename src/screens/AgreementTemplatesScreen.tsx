import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, useTheme, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { RootStackParamList, AgreementTemplate } from '../types';
import { getAgreementTemplates, deleteAgreementTemplate } from '../database';
import { TemplateCard, EmptyState, LoadingIndicator } from '../components';
import { spacing, shadows } from '../constants/theme';
import { confirmDelete } from '../utils/alertUtils';

type AgreementTemplatesNavigationProp = StackNavigationProp<RootStackParamList>;

const AgreementTemplatesScreen: React.FC = () => {
  const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<AgreementTemplatesNavigationProp>();

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAgreementTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading agreement templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [])
  );

  const handleTemplatePress = (template: AgreementTemplate) => {
    navigation.navigate('AgreementTemplateDetails', { templateId: template.id! });
  };

  const handleEditTemplate = (template: AgreementTemplate) => {
    navigation.navigate('EditAgreementTemplate', { template });
  };

  const handleDeleteTemplate = (templateId: number) => {
    confirmDelete(
      'Delete Template',
      'Are you sure you want to delete this template? This action cannot be undone.',
      async () => {
        try {
          await deleteAgreementTemplate(templateId);
          // Refresh the list
          loadTemplates();
        } catch (error) {
          console.error('Error deleting template:', error);
        }
      }
    );
  };

  if (loading && !refreshing) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {templates.length === 0 ? (
        <EmptyState
          icon="file-document-outline"
          title="No Agreement Templates"
          message="Add your first agreement template to get started"
        />
      ) : (
        <Animated.View
          style={styles.listContainer}
          entering={FadeIn.duration(300)}
        >
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id!.toString()}
            renderItem={({ item, index }) => (
              <TemplateCard
                template={item}
                onPress={handleTemplatePress}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                index={index}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        </Animated.View>
      )}

      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary },
          shadows.lg,
        ]}
        color="#fff"
        onPress={() => navigation.navigate('AddAgreementTemplate')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
});

export default AgreementTemplatesScreen;
