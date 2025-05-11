import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, useTheme, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { RootStackParamList, PaymentRequestTemplate } from '../types';
import { getPaymentRequestTemplates, deletePaymentRequestTemplate } from '../database';
import { TemplateCard, EmptyState, LoadingIndicator } from '../components';
import { spacing, shadows } from '../constants/theme';
import { confirmDelete } from '../utils/alertUtils';

type PaymentRequestTemplatesNavigationProp = StackNavigationProp<RootStackParamList>;

const PaymentRequestTemplatesScreen: React.FC = () => {
  const [templates, setTemplates] = useState<PaymentRequestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation<PaymentRequestTemplatesNavigationProp>();

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getPaymentRequestTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading payment request templates:', error);
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

  const handleTemplatePress = (template: PaymentRequestTemplate) => {
    navigation.navigate('PaymentRequestTemplateDetails', { templateId: template.id! });
  };

  const handleEditTemplate = (template: PaymentRequestTemplate) => {
    navigation.navigate('EditPaymentRequestTemplate', { template });
  };

  const handleDeleteTemplate = (templateId: number) => {
    confirmDelete(
      'Delete Template',
      'Are you sure you want to delete this template? This action cannot be undone.',
      async () => {
        try {
          await deletePaymentRequestTemplate(templateId);
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
          title="No Payment Request Templates"
          message="Add your first payment request template to get started"
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
        onPress={() => navigation.navigate('AddPaymentRequestTemplate')}
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

export default PaymentRequestTemplatesScreen;
