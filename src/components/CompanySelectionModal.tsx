import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { Company } from '../database/companiesDb';
import { getCompanies } from '../database/companiesDb';
import { spacing, shadows, borderRadius } from '../constants/theme';

interface CompanySelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (companyId: number) => void;
  title?: string;
}

const CompanySelectionModal: React.FC<CompanySelectionModalProps> = ({
  visible,
  onDismiss,
  onSelect,
  title = 'Select Company',
}) => {
  const theme = useTheme();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {title}
        </Text>

        <RNTextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.onBackground,
              borderColor: theme.colors.outline
            }
          ]}
          placeholder="Search companies..."
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : (
          <ScrollView style={styles.modalScrollView}>
            {filteredCompanies.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceDisabled }]}>
                No companies found
              </Text>
            ) : (
              filteredCompanies.map((company) => (
                <Button
                  key={company.id}
                  mode="text"
                  onPress={() => {
                    onSelect(company.id!);
                    // No need to call onDismiss() as it's handled in the onSelect function
                  }}
                  style={styles.companyButton}
                >
                  {company.name}
                </Button>
              ))
            )}
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
    ...shadows.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  modalScrollView: {
    marginBottom: spacing.md,
    maxHeight: 300,
  },
  companyButton: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    minWidth: 120,
  },
  loader: {
    marginVertical: spacing.lg,
  },
});

export default CompanySelectionModal;
