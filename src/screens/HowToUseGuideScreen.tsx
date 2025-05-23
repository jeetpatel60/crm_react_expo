import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  List,
  useTheme,
  Divider,
  Button,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, shadows } from '../constants/theme';

const HowToUseGuideScreen = () => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const GuideSection = ({ 
    title, 
    icon, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    icon: string; 
    sectionKey: string; 
    children: React.ReactNode; 
  }) => (
    <Card style={[styles.sectionCard, shadows.sm]}>
      <List.Item
        title={title}
        left={(props) => (
          <List.Icon {...props} icon={icon} color={theme.colors.primary} />
        )}
        right={(props) => (
          <IconButton
            {...props}
            icon={expandedSections[sectionKey] ? "chevron-up" : "chevron-down"}
            onPress={() => toggleSection(sectionKey)}
          />
        )}
        onPress={() => toggleSection(sectionKey)}
        style={styles.sectionHeader}
      />
      {expandedSections[sectionKey] && (
        <Card.Content style={styles.sectionContent}>
          {children}
        </Card.Content>
      )}
    </Card>
  );

  const StepItem = ({ step, description }: { step: string; description: string }) => (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.stepNumberText, { color: theme.colors.onPrimary }]}>
          {step}
        </Text>
      </View>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={[styles.welcomeCard, shadows.md]}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <MaterialCommunityIcons 
                name="rocket-launch" 
                size={48} 
                color={theme.colors.primary} 
              />
              <Text variant="headlineSmall" style={styles.welcomeTitle}>
                Welcome to CRM App
              </Text>
              <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
                Your complete solution for managing customers, projects, and business operations
              </Text>
            </View>
          </Card.Content>
        </Card>

        <GuideSection title="Getting Started" icon="play-circle" sectionKey="getting-started">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Initial Setup</Text>
          <StepItem step="1" description="Set up your company information in the Company section" />
          <StepItem step="2" description="Configure your app settings and enable automatic backups" />
          <StepItem step="3" description="Create templates for agreements and payment documents" />
          <StepItem step="4" description="Start adding your first leads and clients" />
        </GuideSection>

        <GuideSection title="Dashboard Overview" icon="view-dashboard" sectionKey="dashboard">
          <Text variant="bodyMedium" style={styles.description}>
            The Dashboard provides a comprehensive overview of your business performance:
          </Text>
          <StepItem step="•" description="View key metrics: Total Leads, Projects, and Revenue" />
          <StepItem step="•" description="Analyze lead and project status distributions" />
          <StepItem step="•" description="Track revenue trends and unit sales performance" />
          <StepItem step="•" description="Monitor weekly and monthly sales data by project" />
        </GuideSection>

        <GuideSection title="Managing Companies" icon="domain" sectionKey="companies">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Company Management</Text>
          <StepItem step="1" description="Navigate to Company section from the sidebar" />
          <StepItem step="2" description="Add your company details including name, address, and contact info" />
          <StepItem step="3" description="Upload company letterhead for professional documents" />
          <StepItem step="4" description="Edit company information as needed" />
        </GuideSection>

        <GuideSection title="Lead Management" icon="account-convert" sectionKey="leads">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Working with Leads</Text>
          <StepItem step="1" description="Go to Leads section and tap the + button to add new leads" />
          <StepItem step="2" description="Fill in lead details: name, contact info, source, and status" />
          <StepItem step="3" description="Track lead progress through different stages" />
          <StepItem step="4" description="Convert qualified leads to clients when ready" />
          <StepItem step="5" description="Use search and filters to find specific leads quickly" />
        </GuideSection>

        <GuideSection title="Client Management" icon="account-tie" sectionKey="clients">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Managing Clients</Text>
          <StepItem step="1" description="Access Clients section from the main menu" />
          <StepItem step="2" description="Add new clients with complete contact information" />
          <StepItem step="3" description="View client details and interaction history" />
          <StepItem step="4" description="Edit client information as relationships develop" />
          <StepItem step="5" description="Link clients to projects and units for better tracking" />
        </GuideSection>

        <GuideSection title="Project Management" icon="briefcase" sectionKey="projects">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Creating and Managing Projects</Text>
          <StepItem step="1" description="Navigate to Projects and create new projects" />
          <StepItem step="2" description="Set project details: name, description, timeline, and budget" />
          <StepItem step="3" description="Track project progress and update status regularly" />
          <StepItem step="4" description="Create project schedules with milestones" />
          <StepItem step="5" description="Monitor project analytics from the Dashboard" />
        </GuideSection>

        <GuideSection title="Units/Flats Management" icon="home-city" sectionKey="units">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Managing Property Units</Text>
          <StepItem step="1" description="Go to Units/Flats section to manage property inventory" />
          <StepItem step="2" description="Add units with details: type, size, price, and status" />
          <StepItem step="3" description="Assign units to clients and track availability" />
          <StepItem step="4" description="Manage payment schedules for each unit" />
          <StepItem step="5" description="Generate payment requests and receipts" />
          <StepItem step="6" description="Use the Flats Availability Report to track sales opportunities" />
        </GuideSection>

        <GuideSection title="Templates & Documents" icon="file-document-multiple" sectionKey="templates">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Document Templates</Text>
          <StepItem step="1" description="Access Templates section to manage document templates" />
          <StepItem step="2" description="Create Agreement Templates for client contracts" />
          <StepItem step="3" description="Set up Payment Request Templates for billing" />
          <StepItem step="4" description="Design Payment Receipt Templates for confirmations" />
          <StepItem step="5" description="Use placeholders that auto-fill with client/project data" />
          <StepItem step="6" description="Generate professional PDFs with company letterhead" />
        </GuideSection>

        <GuideSection title="Reports & Analytics" icon="file-chart" sectionKey="reports">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Generating Reports</Text>
          <StepItem step="1" description="Navigate to Reports section for detailed analytics" />
          <StepItem step="2" description="Use Customer Ledger Report to track client payment history" />
          <StepItem step="3" description="View Flats Availability Report for sales insights" />
          <StepItem step="4" description="Export reports as PDFs with company branding" />
          <StepItem step="5" description="Use filters to customize report data" />
        </GuideSection>

        <GuideSection title="Quotations" icon="file-document-edit" sectionKey="quotations">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Creating Quotations</Text>
          <StepItem step="1" description="Access Quotation section to create price quotes" />
          <StepItem step="2" description="Add quotation details and line items" />
          <StepItem step="3" description="Link quotations to specific leads or clients" />
          <StepItem step="4" description="Track quotation status and follow-ups" />
          <StepItem step="5" description="Convert accepted quotations to projects" />
        </GuideSection>

        <GuideSection title="Settings & Backup" icon="cog" sectionKey="settings">
          <Text variant="titleMedium" style={styles.subsectionTitle}>App Configuration</Text>
          <StepItem step="1" description="Access Settings to configure app preferences" />
          <StepItem step="2" description="Enable automatic database backups (every 2 hours)" />
          <StepItem step="3" description="Manage backup files and restore when needed" />
          <StepItem step="4" description="Customize app theme and notifications" />
          <StepItem step="5" description="Export/import data for backup purposes" />
          <StepItem step="6" description="View database location for manual backups" />
        </GuideSection>

        <Card style={[styles.tipsCard, shadows.sm]}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons 
                name="lightbulb-on" 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text variant="titleMedium" style={styles.tipsTitle}>
                Pro Tips
              </Text>
            </View>
            <StepItem step="💡" description="Use the search functionality to quickly find clients, projects, or units" />
            <StepItem step="💡" description="Enable automatic backups to protect your data" />
            <StepItem step="💡" description="Regularly update project progress for accurate analytics" />
            <StepItem step="💡" description="Use templates to maintain consistent document formatting" />
            <StepItem step="💡" description="Check the Dashboard regularly for business insights" />
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  welcomeCard: {
    marginBottom: spacing.lg,
  },
  welcomeHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  welcomeTitle: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
    opacity: 0.7,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
  },
  sectionContent: {
    paddingTop: 0,
  },
  subsectionTitle: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsCard: {
    marginTop: spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tipsTitle: {
    marginLeft: spacing.sm,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default HowToUseGuideScreen;
