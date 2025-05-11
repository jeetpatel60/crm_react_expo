import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, DataTable, useTheme, FAB, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, Quotation, QuotationAnnexureItem } from '../types';
import {
  getQuotationById,
  deleteQuotation,
  getQuotationAnnexureA,
  getQuotationAnnexureB,
  getQuotationAnnexureC
} from '../database';
import { getProjectById } from '../database/projectsDb';
import { getLeadById } from '../database/leadsDb';
import { getUnitFlatById } from '../database/unitsFlatDb';
import { getCompanyById } from '../database/companiesDb';
import { LoadingIndicator } from '../components';
import { spacing, shadows } from '../constants/theme';
import { formatDate, formatCurrency } from '../utils/formatters';
import { generateAndShareQuotationPdf } from '../utils/pdfUtils';

type QuotationDetailsRouteProp = RouteProp<RootStackParamList, 'QuotationDetails'>;
type QuotationDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const QuotationDetailsScreen = () => {
  const theme = useTheme();
  const route = useRoute<QuotationDetailsRouteProp>();
  const navigation = useNavigation<QuotationDetailsNavigationProp>();
  const { quotationId } = route.params;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [annexureA, setAnnexureA] = useState<QuotationAnnexureItem[]>([]);
  const [annexureB, setAnnexureB] = useState<QuotationAnnexureItem[]>([]);
  const [annexureC, setAnnexureC] = useState<QuotationAnnexureItem[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [leadName, setLeadName] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchQuotationDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch quotation
      const quotationData = await getQuotationById(quotationId);
      if (!quotationData) {
        Alert.alert('Error', 'Quotation not found');
        navigation.goBack();
        return;
      }

      setQuotation(quotationData);

      // Fetch annexure items
      const annexureAData = await getQuotationAnnexureA(quotationId);
      setAnnexureA(annexureAData);

      const annexureBData = await getQuotationAnnexureB(quotationId);
      setAnnexureB(annexureBData);

      const annexureCData = await getQuotationAnnexureC(quotationId);
      setAnnexureC(annexureCData);

      // Fetch related entities
      if (quotationData.project_id) {
        const project = await getProjectById(quotationData.project_id);
        if (project) {
          setProjectName(project.name);
        }
      }

      if (quotationData.lead_id) {
        const lead = await getLeadById(quotationData.lead_id);
        if (lead) {
          setLeadName(lead.name);
        }
      }

      if (quotationData.flat_id) {
        const flat = await getUnitFlatById(quotationData.flat_id);
        if (flat) {
          setFlatNo(flat.flat_no);
        }
      }

      if (quotationData.company_id) {
        const company = await getCompanyById(quotationData.company_id);
        if (company) {
          setCompanyName(company.name);
        }
      }
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      Alert.alert('Error', 'Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  }, [quotationId, navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchQuotationDetails();
    }, [fetchQuotationDetails])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Quotation',
      'Are you sure you want to delete this quotation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuotation(quotationId);
              Alert.alert('Success', 'Quotation deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting quotation:', error);
              Alert.alert('Error', 'Failed to delete quotation');
            }
          },
        },
      ]
    );
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await generateAndShareQuotationPdf(quotationId);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!quotation) {
    return (
      <View style={styles.container}>
        <Text>Quotation not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <Card style={[styles.card, shadows.md, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.title}>
                {quotation.quotation_no}
              </Text>
              <Text variant="titleMedium" style={styles.date}>
                {formatDate(quotation.date)}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailsContainer}>
              {projectName && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Project:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>{projectName}</Text>
                </View>
              )}

              {leadName && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Lead:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>{leadName}</Text>
                </View>
              )}

              {flatNo && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Flat:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>{flatNo}</Text>
                </View>
              )}

              {companyName && (
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>Company:</Text>
                  <Text variant="bodyLarge" style={styles.detailValue}>{companyName}</Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Annexure A */}
            <View style={styles.annexureContainer}>
              <Text variant="titleMedium" style={styles.annexureTitle}>
                Annexure A
              </Text>

              {annexureA.length === 0 ? (
                <Text style={styles.emptyText}>No items in Annexure A</Text>
              ) : (
                <ScrollView horizontal style={styles.tableContainer}>
                  <DataTable style={styles.table}>
                    <DataTable.Header style={styles.tableHeader}>
                      <DataTable.Title style={styles.srNoColumn}>Sr No</DataTable.Title>
                      <DataTable.Title style={styles.descriptionColumn}>Description</DataTable.Title>
                      <DataTable.Title style={styles.amountColumn}>Amount</DataTable.Title>
                    </DataTable.Header>

                    {annexureA.map((item) => (
                      <DataTable.Row key={item.id} style={styles.tableRow}>
                        <DataTable.Cell style={styles.srNoColumn}>{item.sr_no}</DataTable.Cell>
                        <DataTable.Cell style={styles.descriptionColumn}>{item.description}</DataTable.Cell>
                        <DataTable.Cell style={styles.amountColumn}>{formatCurrency(item.amount)}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              )}
            </View>

            {/* Annexure B */}
            <View style={styles.annexureContainer}>
              <Text variant="titleMedium" style={styles.annexureTitle}>
                Annexure B
              </Text>

              {annexureB.length === 0 ? (
                <Text style={styles.emptyText}>No items in Annexure B</Text>
              ) : (
                <ScrollView horizontal style={styles.tableContainer}>
                  <DataTable style={styles.table}>
                    <DataTable.Header style={styles.tableHeader}>
                      <DataTable.Title style={styles.srNoColumn}>Sr No</DataTable.Title>
                      <DataTable.Title style={styles.descriptionColumn}>Description</DataTable.Title>
                      <DataTable.Title style={styles.amountColumn}>Amount</DataTable.Title>
                    </DataTable.Header>

                    {annexureB.map((item) => (
                      <DataTable.Row key={item.id} style={styles.tableRow}>
                        <DataTable.Cell style={styles.srNoColumn}>{item.sr_no}</DataTable.Cell>
                        <DataTable.Cell style={styles.descriptionColumn}>{item.description}</DataTable.Cell>
                        <DataTable.Cell style={styles.amountColumn}>{formatCurrency(item.amount)}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              )}
            </View>

            {/* Annexure C */}
            <View style={styles.annexureContainer}>
              <Text variant="titleMedium" style={styles.annexureTitle}>
                Annexure C
              </Text>

              {annexureC.length === 0 ? (
                <Text style={styles.emptyText}>No items in Annexure C</Text>
              ) : (
                <ScrollView horizontal style={styles.tableContainer}>
                  <DataTable style={styles.table}>
                    <DataTable.Header style={styles.tableHeader}>
                      <DataTable.Title style={styles.srNoColumn}>Sr No</DataTable.Title>
                      <DataTable.Title style={styles.descriptionColumn}>Description</DataTable.Title>
                      <DataTable.Title style={styles.amountColumn}>Amount</DataTable.Title>
                    </DataTable.Header>

                    {annexureC.map((item) => (
                      <DataTable.Row key={item.id} style={styles.tableRow}>
                        <DataTable.Cell style={styles.srNoColumn}>{item.sr_no}</DataTable.Cell>
                        <DataTable.Cell style={styles.descriptionColumn}>{item.description}</DataTable.Cell>
                        <DataTable.Cell style={styles.amountColumn}>{formatCurrency(item.amount)}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              )}
            </View>

            <View style={styles.totalContainer}>
              <Text variant="titleMedium" style={styles.totalLabel}>
                Total Amount:
              </Text>
              <Text
                variant="headlineSmall"
                style={[styles.totalAmount, { color: theme.colors.primary }]}
              >
                {formatCurrency(quotation.total_amount || 0)}
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                onPress={handleExportPdf}
                style={styles.exportButton}
                icon="file-pdf-box"
                loading={exportingPdf}
                disabled={exportingPdf}
              >
                {exportingPdf ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                mode="outlined"
                onPress={handleDelete}
                style={styles.deleteButton}
                icon="delete"
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('EditQuotation', { quotation })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
  },
  date: {
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  divider: {
    marginVertical: spacing.md,
  },
  detailsContainer: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    flex: 1,
  },
  annexureContainer: {
    marginBottom: spacing.lg,
  },
  annexureTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.sm,
    opacity: 0.6,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
  },
  table: {
    minWidth: '100%',
  },
  tableHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  srNoColumn: {
    flex: 0.5,
  },
  descriptionColumn: {
    flex: 2,
  },
  amountColumn: {
    flex: 1,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontWeight: 'bold',
    marginRight: spacing.md,
  },
  totalAmount: {
    fontWeight: 'bold',
  },
  actionsContainer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  deleteButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
});

export default QuotationDetailsScreen;
