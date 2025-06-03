import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, ActivityIndicator, RadioButton } from 'react-native-paper';
import { Company, getCompanies } from '../database/companiesDb';
import { spacing, shadows, borderRadius } from '../constants/theme';

interface CustomerLedgerExportModalProps {
  visible: boolean;
  onDismiss: () => void;
  onExport: (letterheadOption: 'none' | 'company', companyId?: number) => void;
}

const CustomerLedgerExportModal: React.FC<CustomerLedgerExportModalProps> = ({
  visible,
  onDismiss,
  onExport,
}) => {
  const theme = useTheme();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [letterheadOption, setLetterheadOption] = useState<'none' | 'company'>('company');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>();

  useEffect(() => {
    if (visible) {
      loadCompanies();
    }
  }, [visible]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);

      // Select the first company by default if available
      if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id!);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (letterheadOption === 'company' && !selectedCompanyId) {
      return;
    }

    onExport(letterheadOption, selectedCompanyId);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
          Export Customer Ledger Report
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : (
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.letterheadSection}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Letterhead Options
              </Text>

              <View style={styles.letterheadOptions}>
                <View style={styles.letterheadOption}>
                  <RadioButton
                    value="none"
                    status={letterheadOption === 'none' ? 'checked' : 'unchecked'}
                    onPress={() => setLetterheadOption('none')}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                    Without Letterhead
                  </Text>
                </View>

                <View style={styles.letterheadOption}>
                  <RadioButton
                    value="company"
                    status={letterheadOption === 'company' ? 'checked' : 'unchecked'}
                    onPress={() => setLetterheadOption('company')}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>
                    With Company Letterhead
                  </Text>
                </View>
              </View>

              {letterheadOption === 'company' && (
                <View style={styles.companySelection}>
                  <Text variant="bodyMedium" style={[styles.companyLabel, { color: theme.colors.onSurface }]}>
                    Select Company:
                  </Text>
                  {companies.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.colors.onSurfaceDisabled }]}>
                      No companies found
                    </Text>
                  ) : (
                    companies.map((company) => (
                      <View key={company.id} style={styles.companyOption}>
                        <RadioButton
                          value={company.id?.toString() || ''}
                          status={selectedCompanyId === company.id ? 'checked' : 'unchecked'}
                          onPress={() => setSelectedCompanyId(company.id!)}
                          color={theme.colors.primary}
                        />
                        <Text style={[styles.companyText, { color: theme.colors.onSurface }]}>
                          {company.name}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={[styles.button, { borderColor: theme.colors.outline }]}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
            disabled={letterheadOption === 'company' && !selectedCompanyId}
          >
            Export PDF
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    maxHeight: '80%',
    ...shadows.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalScrollView: {
    paddingHorizontal: spacing.lg,
    maxHeight: 400,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  letterheadSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  letterheadOptions: {
    marginBottom: spacing.md,
  },
  letterheadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionText: {
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  companySelection: {
    marginTop: spacing.md,
    paddingLeft: spacing.md,
  },
  companyLabel: {
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  companyText: {
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});

export default CustomerLedgerExportModal;
