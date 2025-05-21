import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Modal, Portal, Text, Button, RadioButton, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PaymentReceiptTemplate } from '../database/paymentReceiptTemplatesDb';
import { getPaymentReceiptTemplates } from '../database/paymentReceiptTemplatesDb';
import { spacing, shadows, borderRadius } from '../constants/theme';

interface PaymentReceiptTemplateSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (templateId: number) => void;
  title?: string;
}

const PaymentReceiptTemplateSelectionModal: React.FC<PaymentReceiptTemplateSelectionModalProps> = ({
  visible,
  onDismiss,
  onSelect,
  title = 'Select Payment Receipt Template',
}) => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<PaymentReceiptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('PaymentReceiptTemplateSelectionModal - visible changed:', visible);
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  const loadTemplates = async () => {
    try {
      console.log('Loading payment receipt templates...');
      setLoading(true);
      const data = await getPaymentReceiptTemplates();
      console.log('Loaded templates:', data);
      setTemplates(data);
      
      // Select the first template by default if available
      if (data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data[0].id!);
      }
    } catch (error) {
      console.error('Error loading payment receipt templates:', error);
      Alert.alert('Error', 'Failed to load payment receipt templates');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedTemplateId) {
      onSelect(selectedTemplateId);
    } else {
      Alert.alert('Error', 'Please select a template');
    }
  };

  const renderItem = ({ item }: { item: PaymentReceiptTemplate }) => (
    <Card 
      style={[
        styles.templateCard, 
        shadows.sm,
        selectedTemplateId === item.id && { 
          borderColor: theme.colors.primary,
          borderWidth: 2,
        }
      ]}
      onPress={() => setSelectedTemplateId(item.id!)}
    >
      <View style={styles.templateCardContent}>
        <RadioButton
          value={item.id?.toString() || ''}
          status={selectedTemplateId === item.id ? 'checked' : 'unchecked'}
          onPress={() => setSelectedTemplateId(item.id!)}
          color={theme.colors.primary}
        />
        <View style={styles.templateInfo}>
          <Text variant="titleMedium" style={styles.templateName}>{item.name}</Text>
          <Text 
            variant="bodySmall" 
            style={styles.templatePreview}
            numberOfLines={2}
          >
            {item.content.substring(0, 100)}...
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background }
        ]}
      >
        <View style={styles.modalHeader}>
          <Text variant="titleLarge" style={styles.modalTitle}>{title}</Text>
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={theme.colors.onSurface}
            onPress={onDismiss}
            style={styles.closeIcon}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading templates...</Text>
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.emptyText}>No payment receipt templates available</Text>
            <Text style={styles.emptySubtext}>
              Please create a payment receipt template first
            </Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
            disabled={!selectedTemplateId || templates.length === 0}
          >
            Select
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontWeight: '600',
  },
  closeIcon: {
    padding: spacing.xs,
  },
  templateCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  templateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  templateInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  templateName: {
    fontWeight: '500',
  },
  templatePreview: {
    marginTop: spacing.xs,
    color: '#666',
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  button: {
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: spacing.xs,
    color: '#666',
    textAlign: 'center',
  },
});

export default PaymentReceiptTemplateSelectionModal; 