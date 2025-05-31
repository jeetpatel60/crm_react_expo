import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Modal, Portal, Text, Button, RadioButton, Card, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PaymentRequestTemplate } from '../database/paymentRequestTemplatesDb';
import { getPaymentRequestTemplates } from '../database/paymentRequestTemplatesDb';
import { Company, getCompanies } from '../database/companiesDb';
import { spacing, shadows, borderRadius } from '../constants/theme';

interface TemplateSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (templateId: number, letterheadOption: 'none' | 'company', companyId?: number) => void;
  title?: string;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  visible,
  onDismiss,
  onSelect,
  title = 'Select Template',
}) => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<PaymentRequestTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [letterheadOption, setLetterheadOption] = useState<'none' | 'company'>('none');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      loadTemplates();
      loadCompanies();
    }
  }, [visible]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getPaymentRequestTemplates();
      setTemplates(data);

      // Select the first template by default if available
      if (data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data[0].id!);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);

      // Select the first company by default if available
      if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id!);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleConfirm = () => {
    if (!selectedTemplateId) {
      Alert.alert('Error', 'Please select a template');
      return;
    }

    if (letterheadOption === 'company' && !selectedCompanyId) {
      Alert.alert('Error', 'Please select a company for letterhead');
      return;
    }

    onSelect(selectedTemplateId, letterheadOption, selectedCompanyId || undefined);
  };

  const renderItem = ({ item }: { item: PaymentRequestTemplate }) => (
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
            <Text style={styles.emptyText}>No templates available</Text>
            <Text style={styles.emptySubtext}>
              Please create a payment request template first
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={templates}
              renderItem={renderItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.listContent}
            />

            <Divider style={styles.divider} />

            <View style={styles.letterheadSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Letterhead Options</Text>

              <View style={styles.letterheadOptions}>
                <View style={styles.letterheadOption}>
                  <RadioButton
                    value="none"
                    status={letterheadOption === 'none' ? 'checked' : 'unchecked'}
                    onPress={() => setLetterheadOption('none')}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.optionText}>Without Letterhead</Text>
                </View>

                <View style={styles.letterheadOption}>
                  <RadioButton
                    value="company"
                    status={letterheadOption === 'company' ? 'checked' : 'unchecked'}
                    onPress={() => setLetterheadOption('company')}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.optionText}>With Company Letterhead</Text>
                </View>
              </View>

              {letterheadOption === 'company' && (
                <View style={styles.companySelection}>
                  <Text variant="bodyMedium" style={styles.companyLabel}>Select Company:</Text>
                  {companies.map((company) => (
                    <View key={company.id} style={styles.companyOption}>
                      <RadioButton
                        value={company.id?.toString() || ''}
                        status={selectedCompanyId === company.id ? 'checked' : 'unchecked'}
                        onPress={() => setSelectedCompanyId(company.id!)}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.companyText}>{company.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
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
    padding: spacing.md,
    borderRadius: borderRadius.md,
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
  listContent: {
    paddingVertical: spacing.sm,
  },
  templateCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  templateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  templateInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  templateName: {
    fontWeight: '500',
  },
  templatePreview: {
    color: '#666',
    marginTop: spacing.xs,
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
  divider: {
    marginVertical: spacing.md,
  },
  letterheadSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  letterheadOptions: {
    marginBottom: spacing.sm,
  },
  letterheadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  optionText: {
    marginLeft: spacing.xs,
  },
  companySelection: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  companyLabel: {
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  companyText: {
    marginLeft: spacing.xs,
  },
});

export default TemplateSelectionModal;
