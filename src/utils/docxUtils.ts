import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { shareAsync } from 'expo-sharing';

import {
  AgreementTemplate,
  UnitFlat,
  Client,
  Project,
  Company,
  Milestone,
  UnitCustomerSchedule,
  UnitPaymentRequest,
  UnitPaymentReceipt
} from '../types';
import { formatCurrency, formatDate } from './formatters';
import { getUnitFlatById } from '../database/unitsFlatDb';
import { getClientById } from '../database/clientsDb';
import { getProjectById } from '../database/projectsDb';
import { getCompanyById } from '../database/companiesDb';
import { getMilestonesByScheduleId } from '../database/projectSchedulesDb';
import { getUnitCustomerSchedules } from '../database/unitCustomerSchedulesDb';
import { getUnitPaymentRequests } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceipts } from '../database/unitPaymentReceiptsDb';

// Interface for template data
interface TemplateData {
  unitData?: UnitFlat;
  clientData?: Client;
  projectData?: Project;
  companyData?: Company;
  projectMilestones?: Milestone[];
  customerSchedules?: UnitCustomerSchedule[];
  paymentRequests?: UnitPaymentRequest[];
  paymentReceipts?: UnitPaymentReceipt[];
  pendingPayments?: UnitPaymentRequest[];
  currentDate: string;
}

/**
 * Generate a .docx document from a template and share it
 */
export const generateAndShareDocxDocument = async (
  templateId: number,
  unitId?: number,
  clientId?: number,
  projectId?: number,
  companyId?: number,
  specificPaymentRequestId?: number
): Promise<void> => {
  try {
    // Prepare data for document generation
    const data = await prepareTemplateData(
      templateId,
      unitId,
      clientId,
      projectId,
      companyId,
      specificPaymentRequestId
    );

    // Get the template content
    const { getAgreementTemplateById } = require('../database/agreementTemplatesDb');
    const template = await getAgreementTemplateById(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    // For a real implementation, we would need to convert the HTML template to a docx file
    // For this demo, we'll create a simple text file with the template content
    const templateUri = `${FileSystem.cacheDirectory}template_${Date.now()}.docx`;

    // Write the template content to the file
    await FileSystem.writeAsStringAsync(templateUri, template.content);

    // Read the template file
    const templateContent = await FileSystem.readAsStringAsync(templateUri);

    // In a real implementation, we would use docxtemplater to process a docx template
    // For this demo, we'll just replace the placeholders in the text content
    let processedContent = templateContent;

    // Replace unit-related placeholders
    if (data.unitData) {
      processedContent = processedContent.replace(/\{\{FLAT_NO\}\}/g, data.unitData.flat_no || '');
      processedContent = processedContent.replace(/\{\{AREA_SQFT\}\}/g, data.unitData.area_sqft?.toString() || '');
      processedContent = processedContent.replace(/\{\{RATE_PER_SQFT\}\}/g, data.unitData.rate_per_sqft?.toString() || '');
      processedContent = processedContent.replace(/\{\{FLAT_VALUE\}\}/g, formatCurrency(data.unitData.flat_value || 0));
      processedContent = processedContent.replace(/\{\{RECEIVED_AMOUNT\}\}/g, formatCurrency(data.unitData.received_amount || 0));
      processedContent = processedContent.replace(/\{\{BALANCE_AMOUNT\}\}/g, formatCurrency(data.unitData.balance_amount || 0));
      processedContent = processedContent.replace(/\{\{FLAT_TYPE\}\}/g, data.unitData.type || '');
    }

    // Replace client-related placeholders
    if (data.clientData) {
      processedContent = processedContent.replace(/\{\{CLIENT_NAME\}\}/g, data.clientData.name || '');
      processedContent = processedContent.replace(/\{\{CLIENT_ADDRESS\}\}/g, data.clientData.address || '');
      processedContent = processedContent.replace(/\{\{CLIENT_PAN\}\}/g, data.clientData.pan_no || '');
      processedContent = processedContent.replace(/\{\{CLIENT_GSTIN\}\}/g, data.clientData.gstin_no || '');
      processedContent = processedContent.replace(/\{\{CLIENT_CONTACT\}\}/g, data.clientData.contact_no || '');
      processedContent = processedContent.replace(/\{\{CLIENT_EMAIL\}\}/g, data.clientData.email || '');
    }

    // Replace project-related placeholders
    if (data.projectData) {
      processedContent = processedContent.replace(/\{\{PROJECT_NAME\}\}/g, data.projectData.name || '');
      processedContent = processedContent.replace(/\{\{PROJECT_ADDRESS\}\}/g, data.projectData.address || '');
      processedContent = processedContent.replace(/\{\{PROJECT_START_DATE\}\}/g, formatDate(data.projectData.start_date || 0));
      processedContent = processedContent.replace(/\{\{PROJECT_END_DATE\}\}/g, formatDate(data.projectData.end_date || 0));
      processedContent = processedContent.replace(/\{\{PROJECT_PROGRESS\}\}/g, `${data.projectData.progress || 0}%`);
      processedContent = processedContent.replace(/\{\{PROJECT_BUDGET\}\}/g, formatCurrency(data.projectData.total_budget || 0));
    }

    // Replace company-related placeholders
    if (data.companyData) {
      processedContent = processedContent.replace(/\{\{COMPANY_NAME\}\}/g, data.companyData.name || '');
      processedContent = processedContent.replace(/\{\{COMPANY_SALUTATION\}\}/g, data.companyData.salutation || '');
    }

    // Replace date placeholders
    processedContent = processedContent.replace(/\{\{CURRENT_DATE\}\}/g, formatDate(Date.now()));

    // Replace table placeholders with simple text representations
    // In a real implementation, we would generate proper tables in the docx

    // Customer Schedules Table
    let customerSchedulesTable = '';
    if (data.customerSchedules && data.customerSchedules.length > 0) {
      customerSchedulesTable = 'CUSTOMER SCHEDULES:\n\n';
      data.customerSchedules.forEach(schedule => {
        customerSchedulesTable += `Sr. No: ${schedule.sr_no}\n`;
        customerSchedulesTable += `Milestone: ${schedule.milestone}\n`;
        customerSchedulesTable += `Completion: ${schedule.completion_percentage}%\n`;
        customerSchedulesTable += `Amount: ${formatCurrency(schedule.amount || 0)}\n`;
        customerSchedulesTable += `Status: ${schedule.status}\n\n`;
      });
    }
    processedContent = processedContent.replace(/\{\{CUSTOMER_SCHEDULES_TABLE\}\}/g, customerSchedulesTable);

    // Project Milestones Table
    let projectMilestonesTable = '';
    if (data.projectMilestones && data.projectMilestones.length > 0) {
      projectMilestonesTable = 'PROJECT MILESTONES:\n\n';
      data.projectMilestones.forEach(milestone => {
        projectMilestonesTable += `Sr. No: ${milestone.sr_no}\n`;
        projectMilestonesTable += `Milestone: ${milestone.milestone_name}\n`;
        projectMilestonesTable += `Completion: ${milestone.completion_percentage}%\n`;
        projectMilestonesTable += `Status: ${milestone.status}\n\n`;
      });
    }
    processedContent = processedContent.replace(/\{\{PROJECT_MILESTONES_TABLE\}\}/g, projectMilestonesTable);

    // Payment Requests Table
    let paymentRequestsTable = '';
    if (data.paymentRequests && data.paymentRequests.length > 0) {
      paymentRequestsTable = 'PAYMENT REQUESTS:\n\n';
      data.paymentRequests.forEach(request => {
        paymentRequestsTable += `Sr. No: ${request.sr_no}\n`;
        paymentRequestsTable += `Date: ${formatDate(request.date)}\n`;
        paymentRequestsTable += `Description: ${request.description || '-'}\n`;
        paymentRequestsTable += `Amount: ${formatCurrency(request.amount)}\n\n`;
      });
    }
    processedContent = processedContent.replace(/\{\{PAYMENT_REQUESTS_TABLE\}\}/g, paymentRequestsTable);

    // Payment Receipts Table
    let paymentReceiptsTable = '';
    if (data.paymentReceipts && data.paymentReceipts.length > 0) {
      paymentReceiptsTable = 'PAYMENT RECEIPTS:\n\n';
      data.paymentReceipts.forEach(receipt => {
        paymentReceiptsTable += `Sr. No: ${receipt.sr_no}\n`;
        paymentReceiptsTable += `Date: ${formatDate(receipt.date)}\n`;
        paymentReceiptsTable += `Description: ${receipt.description || '-'}\n`;
        paymentReceiptsTable += `Amount: ${formatCurrency(receipt.amount)}\n`;
        paymentReceiptsTable += `Mode: ${receipt.mode || '-'}\n`;
        paymentReceiptsTable += `Remarks: ${receipt.remarks || '-'}\n\n`;
      });
    }
    processedContent = processedContent.replace(/\{\{PAYMENT_RECEIPTS_TABLE\}\}/g, paymentReceiptsTable);

    // Create a temporary file to store the processed content
    const outputUri = `${FileSystem.cacheDirectory}agreement_${Date.now()}.docx`;

    // Write the processed content to the file
    await FileSystem.writeAsStringAsync(outputUri, processedContent);

    // Share the file
    await shareAsync(outputUri, {
      UTI: 'org.openxmlformats.wordprocessingml.document',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // Clean up temporary files
    await FileSystem.deleteAsync(templateUri, { idempotent: true });
    await FileSystem.deleteAsync(outputUri, { idempotent: true });
  } catch (error) {
    console.error('Error generating or sharing document:', error);
    Alert.alert('Error', 'Failed to generate or share document. Please try again.');
  }
};

/**
 * Prepare all data needed for document generation
 */
const prepareTemplateData = async (
  templateId: number,
  unitId?: number,
  clientId?: number,
  projectId?: number,
  companyId?: number,
  specificPaymentRequestId?: number
): Promise<TemplateData> => {
  // Initialize data object
  const data: TemplateData = {
    currentDate: formatDate(Date.now())
  };

  // Fetch related entities if IDs are provided
  if (unitId) {
    const unitData = await getUnitFlatById(unitId);
    if (unitData) {
      data.unitData = unitData;

      // Fetch customer schedules, payment requests, and payment receipts for the unit
      data.customerSchedules = await getUnitCustomerSchedules(unitId);
      data.paymentRequests = await getUnitPaymentRequests(unitId);
      data.paymentReceipts = await getUnitPaymentReceipts(unitId);

      // All payment requests are considered pending since there's no status field
      data.pendingPayments = [...data.paymentRequests];

      // If a specific payment request ID is provided, filter to only that one
      if (specificPaymentRequestId) {
        data.paymentRequests = data.paymentRequests.filter(
          request => request.id === specificPaymentRequestId
        );
      }

      // If project ID is not provided, get it from the unit
      if (!projectId && unitData.project_id) {
        projectId = unitData.project_id;
      }

      // If client ID is not provided, get it from the unit
      if (!clientId && unitData.client_id) {
        clientId = unitData.client_id;
      }
    }
  }

  if (clientId) {
    const clientData = await getClientById(clientId);
    if (clientData) {
      data.clientData = clientData;
    }
  }

  if (projectId) {
    const projectData = await getProjectById(projectId);
    if (projectData) {
      data.projectData = projectData;

      // Fetch project milestones
      const { db } = require('../database/database');
      const schedules = await db.getAllAsync(
        'SELECT * FROM project_schedules WHERE project_id = ? LIMIT 1;',
        [projectId]
      );

      if (schedules.length > 0) {
        const scheduleId = schedules[0].id;
        data.projectMilestones = await getMilestonesByScheduleId(scheduleId);
      }

      // If company ID is not provided, get it from the project
      if (!companyId && projectData.company_id) {
        companyId = projectData.company_id;
      }
    }
  }

  if (companyId) {
    const companyData = await getCompanyById(companyId);
    if (companyData) {
      data.companyData = companyData;
    }
  }

  return data;
};
