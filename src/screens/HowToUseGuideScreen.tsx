import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
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
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/samvida-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text variant="headlineSmall" style={styles.welcomeTitle}>
                Welcome to SAMVIDA CRM
              </Text>
              <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
                Your comprehensive CRM solution for managing leads, clients, projects, units, payments, and reports with advanced PDF generation and backup features
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
          <StepItem step="•" description="Total Leads card shows unconverted leads count and redirects to Leads page when clicked" />
          <StepItem step="•" description="Total Projects card redirects to Projects page when clicked" />
          <StepItem step="•" description="Total Revenue shows the total value of all sold units/flats" />
          <StepItem step="•" description="Analyze lead and project status distributions with interactive charts" />
          <StepItem step="•" description="Track revenue trends and unit sales performance with project filters" />
          <StepItem step="•" description="Monitor weekly and monthly sales data by project" />
          <StepItem step="•" description="Left sidebar is expanded by default for easy navigation" />
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
          <StepItem step="1" description="Go to Leads section and tap the floating action button (left side) to add new leads" />
          <StepItem step="2" description="Fill in lead details: name, contact info, source, and status" />
          <StepItem step="3" description="Track lead progress through different stages" />
          <StepItem step="4" description="Convert qualified leads to clients when ready" />
          <StepItem step="5" description="Use search and filters to find specific leads quickly" />
        </GuideSection>

        <GuideSection title="Client Management" icon="account-tie" sectionKey="clients">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Managing Clients</Text>
          <StepItem step="1" description="Access Clients section from the main menu" />
          <StepItem step="2" description="Add new clients using the floating action button (left side)" />
          <StepItem step="3" description="Fill in complete contact information" />
          <StepItem step="4" description="View client details and interaction history" />
          <StepItem step="5" description="Edit client information as relationships develop" />
          <StepItem step="6" description="Link clients to projects and units for better tracking" />
        </GuideSection>

        <GuideSection title="Project Management" icon="briefcase" sectionKey="projects">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Creating and Managing Projects</Text>
          <StepItem step="1" description="Navigate to Projects and tap the floating action button (left side) to create new projects" />
          <StepItem step="2" description="Set project details: name, description, timeline, and Total Budget (mandatory field)" />
          <StepItem step="3" description="Add and edit schedule and milestone sections are expanded by default" />
          <StepItem step="4" description="Use floating action button at bottom left to save/update projects" />
          <StepItem step="5" description="Track project progress and update status regularly" />
          <StepItem step="6" description="Create project schedules with milestones" />
          <StepItem step="7" description="Monitor project analytics from the Dashboard" />
        </GuideSection>

        <GuideSection title="Units/Flats Management" icon="home-city" sectionKey="units">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Managing Property Units</Text>
          <StepItem step="1" description="Go to Units/Flats section to manage property inventory" />
          <StepItem step="2" description="Add units with Type dropdown (1 RK, 1 BHK, 1.5 BHK, 2 BHK, 2.5 BHK, 3 BHK, 3.5 BHK, 4 BHK, 4.5 BHK, 5 BHK, 5.5 BHK, 6 BHK)" />
          <StepItem step="3" description="Rate & Received Amount fields are only editable when status is changed to 'Sold'" />
          <StepItem step="4" description="Unit/Flats dropdowns only show flats with 'Available' status" />
          <StepItem step="5" description="Assign units to clients and track availability" />
          <StepItem step="6" description="Manage payment schedules for each unit" />
          <StepItem step="7" description="Generate payment requests and receipts with letterhead options" />
          <StepItem step="8" description="Use the Flats Availability Report with compact cards for better space management" />
          <StepItem step="9" description="In Flats availability report, sold flats do not display client names" />
        </GuideSection>

        <GuideSection title="Templates & Documents" icon="file-document-multiple" sectionKey="templates">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Document Templates</Text>
          <StepItem step="1" description="Access Templates section to manage document templates" />
          <StepItem step="2" description="Create Agreement Templates for client contracts" />
          <StepItem step="3" description="Set up Payment Request Templates for billing" />
          <StepItem step="4" description="Design Payment Receipt Templates for confirmations" />
          <StepItem step="5" description="Use placeholders that auto-fill with client/project data" />
          <StepItem step="6" description="Generate professional PDFs with letterhead/non-letterhead options" />
          <StepItem step="7" description="Choose between letterhead and non-letterhead versions after template selection" />
          <StepItem step="8" description="PDFs without letterhead leave 150px space from the top of the page" />
          <StepItem step="9" description="PDF files have descriptive file names when generated" />
        </GuideSection>

        <GuideSection title="Reports & Analytics" icon="file-chart" sectionKey="reports">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Generating Reports</Text>
          <StepItem step="1" description="Click on Reports in sidebar to open the submenu instead of navigating directly" />
          <StepItem step="2" description="Use Customer Ledger Report to track client payment history" />
          <StepItem step="3" description="Customer Ledger Report shows Flat Value before Payment request/receipt data" />
          <StepItem step="4" description="Payment receipt data includes Payment mode and Remarks after amount" />
          <StepItem step="5" description="Customer Ledger Report shows 'Total Amount Received' below Balance Amount" />
          <StepItem step="6" description="After client selection, choose filtering: 'All records', 'Only White' (W Value and non-cash), or 'Only Black' (B Value and cash/others)" />
          <StepItem step="7" description="View Flats Availability Report with compact cards and no background cards" />
          <StepItem step="8" description="Export reports as PDFs with letterhead/non-letterhead options" />
          <StepItem step="9" description="Export PDF buttons are positioned as floating action buttons in bottom left" />
          <StepItem step="10" description="Customer Ledger PDF includes Project Name and Flat No in client info section" />
        </GuideSection>

        <GuideSection title="Quotations" icon="file-document-edit" sectionKey="quotations">
          <Text variant="titleMedium" style={styles.subsectionTitle}>Creating Quotations</Text>
          <StepItem step="1" description="Access Quotation section to create price quotes" />
          <StepItem step="2" description="Add quotation details and line items with optimized dark mode support" />
          <StepItem step="3" description="Link quotations to specific leads or clients" />
          <StepItem step="4" description="Track quotation status and follow-ups" />
          <StepItem step="5" description="Export quotation PDFs with filename format: {project}-{lead}-{flat}-{quotation no}" />
          <StepItem step="6" description="Special characters in filenames are properly sanitized" />
          <StepItem step="7" description="Convert accepted quotations to projects" />
        </GuideSection>

        <GuideSection title="Settings & Backup" icon="cog" sectionKey="settings">
          <Text variant="titleMedium" style={styles.subsectionTitle}>App Configuration</Text>
          <StepItem step="1" description="Access Settings to configure app preferences" />
          <StepItem step="2" description="Enable automatic database backups (every 2 hours)" />
          <StepItem step="3" description="Download the latest generated database backup using expo-sharing" />
          <StepItem step="4" description="Choose where to save backup files instead of automatic Downloads folder" />
          <StepItem step="5" description="Database Location dialog has clickable paths to open folders" />
          <StepItem step="6" description="Copy database file and backup folder paths to clipboard" />
          <StepItem step="7" description="Manage backup files and restore when needed" />
          <StepItem step="8" description="Use the theme switcher at the top of Settings to customize app appearance" />
          <StepItem step="9" description="Enhanced dark mode optimization with proper theming" />
        </GuideSection>

        <GuideSection title="UI/UX Features" icon="palette" sectionKey="ui-features">
          <Text variant="titleMedium" style={styles.subsectionTitle}>User Interface Improvements</Text>
          <StepItem step="•" description="Floating action buttons are positioned on the left side of the screen" />
          <StepItem step="•" description="Left sidebar uses the Samvida logo and is expanded by default" />
          <StepItem step="•" description="View Profile button has been removed from sidebar" />
          <StepItem step="•" description="Table description columns wrap long text instead of truncating" />
          <StepItem step="•" description="Labels in balance/summary sections break into multiple lines to prevent amount truncation" />
          <StepItem step="•" description="Enhanced dark mode with dynamic colors for text, backgrounds, borders, and tables" />
          <StepItem step="•" description="Compact card layouts for better space management" />
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
            <StepItem step="💡" description="Enable automatic backups to protect your data (every 2 hours)" />
            <StepItem step="💡" description="Use floating action buttons on the left side for quick actions" />
            <StepItem step="💡" description="Choose letterhead/non-letterhead options when generating PDFs" />
            <StepItem step="💡" description="Use Customer Ledger filtering options for specific record types" />
            <StepItem step="💡" description="Regularly update project progress for accurate analytics" />
            <StepItem step="💡" description="Use templates to maintain consistent document formatting" />
            <StepItem step="💡" description="Check the Dashboard regularly for business insights" />
            <StepItem step="💡" description="Take advantage of dark mode for better viewing in low light" />
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
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    width: 70,
    height: 70,
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
