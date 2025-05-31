import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

import {
  AgreementTemplate,
  PaymentRequestTemplate,
  PaymentReceiptTemplate, // Added
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
import { db } from '../database/database';

// Interface for database query results
interface ProjectScheduleResult {
  id: number;
}
import { getUnitFlatById } from '../database/unitsFlatDb';
import { getClientById } from '../database/clientsDb';
import { getProjectById } from '../database/projectsDb';
import { getCompanyById } from '../database/companiesDb';
import { getMilestonesByScheduleId } from '../database/projectSchedulesDb';
import { getUnitCustomerSchedules } from '../database/unitCustomerSchedulesDb';
import { getUnitPaymentRequests } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceipts } from '../database/unitPaymentReceiptsDb';
import { getPaymentReceiptTemplateById } from '../database/paymentReceiptTemplatesDb'; // Added
import { getAgreementTemplateById } from '../database/agreementTemplatesDb'; // Added
import { getPaymentRequestTemplateById } from '../database/paymentRequestTemplatesDb'; // Added

// Interface for template data
interface TemplateData {
  template: AgreementTemplate | PaymentRequestTemplate | PaymentReceiptTemplate; // Updated
  unitId?: number;
  clientId?: number;
  projectId?: number;
  companyId?: number;
  unitData?: UnitFlat;
  clientData?: Client;
  projectData?: Project;
  companyData?: Company;
  companyLetterheadBase64?: string;
  companyLetterheadType?: 'image' | 'pdf';
  projectMilestones?: Milestone[];
  customerSchedules?: UnitCustomerSchedule[];
  paymentRequests?: UnitPaymentRequest[];
  paymentReceipts?: UnitPaymentReceipt[];
  pendingPayments?: UnitPaymentRequest[];
  specificPaymentReceiptId?: number;
  currentDate: string;
}

/**
 * Generate document from template and share it
 */
export const generateAndShareTemplateDocument = async (
  templateId: number,
  templateType: 'agreement' | 'payment-request' | 'payment-receipt',
  unitId?: number,
  clientId?: number,
  projectId?: number,
  companyId?: number,
  specificPaymentRequestId?: number,
  specificPaymentReceiptId?: number,
  letterheadOption?: 'none' | 'company',
  letterheadCompanyId?: number
): Promise<void> => {
  try {
    console.log('Starting template document generation with:', {
      templateId,
      templateType,
      unitId,
      clientId,
      projectId,
      companyId,
      specificPaymentRequestId,
      specificPaymentReceiptId,
      letterheadOption,
      letterheadCompanyId
    });

    // Determine the effective company ID for letterhead
    let effectiveCompanyId = companyId;
    if (letterheadOption === 'company' && letterheadCompanyId) {
      effectiveCompanyId = letterheadCompanyId;
    } else if (letterheadOption === 'none') {
      effectiveCompanyId = undefined; // Don't load any company data for letterhead
    }

    // Prepare data for document generation
    const data = await prepareTemplateData(
      templateId,
      templateType,
      unitId,
      clientId,
      projectId,
      effectiveCompanyId,
      specificPaymentRequestId,
      specificPaymentReceiptId,
      letterheadOption
    );

    console.log('Template data prepared:', {
      hasTemplate: !!data.template,
      hasUnitData: !!data.unitData,
      hasClientData: !!data.clientData,
      hasProjectData: !!data.projectData,
      hasCompanyData: !!data.companyData,
      hasLetterhead: !!data.companyLetterheadBase64,
      letterheadType: data.companyLetterheadType,
      paymentRequestsCount: data.paymentRequests?.length || 0
    });

    // Generate HTML content
    const htmlContent = generateTemplateHtml(data);

    console.log('HTML content generated, length:', htmlContent.length);

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    console.log('PDF generated at:', uri);

    // Generate appropriate filename
    const filename = generatePdfFilename(data, templateType);
    console.log('Generated filename:', filename);

    // Create a new file with the appropriate name
    const newUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: newUri
    });

    console.log('PDF saved with filename at:', newUri);

    // Share the PDF file with the proper filename
    await shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating or sharing document:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    Alert.alert('Error', 'Failed to generate or share document. Please check the console for details.');
  }
};

/**
 * Prepare all data needed for document generation
 */
const prepareTemplateData = async (
  templateId: number,
  templateType: 'agreement' | 'payment-request' | 'payment-receipt',
  unitId?: number,
  clientId?: number,
  projectId?: number,
  companyId?: number,
  specificPaymentRequestId?: number,
  specificPaymentReceiptId?: number,
  letterheadOption?: 'none' | 'company'
): Promise<TemplateData> => {
  // Fetch template data
  let template: AgreementTemplate | PaymentRequestTemplate | PaymentReceiptTemplate | null;
  if (templateType === 'agreement') {
    template = await getAgreementTemplateById(templateId);
  } else if (templateType === 'payment-request') {
    template = await getPaymentRequestTemplateById(templateId);
  } else if (templateType === 'payment-receipt') {
    template = await getPaymentReceiptTemplateById(templateId);
  } else {
    template = null; // Fallback, though type guard should prevent this
  }

  if (!template) {
    throw new Error('Template not found');
  }

  // Reassign to a new const to help TypeScript with type narrowing
  const nonNullTemplate = template;

  // Initialize data object
  const data: TemplateData = { template: nonNullTemplate, currentDate: formatDate(Date.now()) };

  // Fetch related entities if IDs are provided
  if (unitId) {
    const unitData = await getUnitFlatById(unitId);
    if (unitData) {
      data.unitData = unitData;
      data.unitId = unitId;

      // If projectId is not provided, get it from the unit
      if (!projectId && unitData.project_id) {
        projectId = unitData.project_id;
      }

      // Fetch customer schedules, payment requests, and payment receipts for the unit
      data.customerSchedules = await getUnitCustomerSchedules(unitId);
      data.paymentRequests = await getUnitPaymentRequests(unitId);
      data.paymentReceipts = await getUnitPaymentReceipts(unitId);

      // All payment requests are considered pending since there's no status field
      data.pendingPayments = [...data.paymentRequests];

      // If a specific payment request ID is provided, filter the payment requests
      if (specificPaymentRequestId) {
        const { getUnitPaymentRequestById } = require('../database/unitPaymentRequestsDb');
        const specificRequest = await getUnitPaymentRequestById(specificPaymentRequestId);

        if (specificRequest && specificRequest.unit_id === unitId) {
          // Replace the payment requests array with just the specific request
          data.paymentRequests = [specificRequest];
          data.pendingPayments = [specificRequest];
        }
      }

      // If a specific payment receipt ID is provided, filter the payment receipts
      if (specificPaymentReceiptId) {
        const { getUnitPaymentReceiptById } = require('../database/unitPaymentReceiptsDb');
        const specificReceipt = await getUnitPaymentReceiptById(specificPaymentReceiptId);

        if (specificReceipt && specificReceipt.unit_id === unitId) {
          // Replace the payment receipts array with just the specific receipt
          data.paymentReceipts = [specificReceipt];
          data.specificPaymentReceiptId = specificPaymentReceiptId;
        }
      }
    }
  }

  if (clientId) {
    const clientData = await getClientById(clientId);
    if (clientData) {
      data.clientData = clientData;
      data.clientId = clientId;
    }
  }

  if (projectId) {
    const projectData = await getProjectById(projectId);
    if (projectData) {
      data.projectData = projectData;
      data.projectId = projectId;

      // If companyId is not provided, get it from the project
      if (!companyId && projectData.company_id) {
        companyId = projectData.company_id;
        console.log(`Using company ID ${companyId} from project ${projectId}`);
      }

      // Fetch project schedules and milestones
      try {
        // Get the project schedule ID
        const scheduleResult = await db.getFirstAsync(
          'SELECT id FROM project_schedules WHERE project_id = ? LIMIT 1;',
          [projectId]
        ) as ProjectScheduleResult; // Cast to the defined interface

        if (scheduleResult && scheduleResult.id) {
          // Fetch milestones for the schedule
          data.projectMilestones = await getMilestonesByScheduleId(scheduleResult.id);
        }
      } catch (error) {
        console.error('Error fetching project milestones:', error);
      }
    }
  }

  // Only load company data if letterhead option is not 'none'
  if (companyId && letterheadOption !== 'none') {
    console.log(`Fetching company data for ID: ${companyId}`);
    const companyData = await getCompanyById(companyId);
    if (companyData) {
      data.companyData = companyData;
      data.companyId = companyId;

      // Process letterhead if available
      if (companyData.letterhead_path) {
        try {
          console.log(`Processing letterhead from path: ${companyData.letterhead_path}`);
          const fileInfo = await FileSystem.getInfoAsync(companyData.letterhead_path);
          if (fileInfo.exists) {
            // Determine file type
            const extension = companyData.letterhead_path.split('.').pop()?.toLowerCase() || '';
            if (['jpg', 'jpeg', 'png'].includes(extension)) {
              data.companyLetterheadType = 'image';
              const base64 = await FileSystem.readAsStringAsync(companyData.letterhead_path, {
                encoding: FileSystem.EncodingType.Base64,
              });
              data.companyLetterheadBase64 = `data:image/${extension};base64,${base64}`;
              console.log(`Letterhead processed as image/${extension}`);
            } else if (extension === 'pdf') {
              data.companyLetterheadType = 'pdf';
              console.log('Letterhead is PDF format (cannot be embedded directly in HTML)');
              // We can't embed PDF letterhead directly in HTML
            }
          } else {
            console.log(`Letterhead file does not exist at path: ${companyData.letterhead_path}`);
          }
        } catch (error) {
          console.error('Error processing letterhead:', error);
        }
      } else {
        console.log('No letterhead path found for company');
      }
    } else {
      console.log(`Company with ID ${companyId} not found`);
    }
  } else {
    if (letterheadOption === 'none') {
      console.log('Letterhead option is set to none, skipping company data loading');
    } else {
      console.log('No company ID provided');
    }
  }

  return data;
};

/**
 * Generate appropriate filename for PDF based on template data and type
 */
const generatePdfFilename = (data: TemplateData, templateType: 'agreement' | 'payment-request' | 'payment-receipt'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]; // YYYY-MM-DD format
  const time = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]; // HH-MM-SS format

  let baseFilename = '';

  switch (templateType) {
    case 'agreement':
      baseFilename = 'Agreement';
      break;
    case 'payment-request':
      baseFilename = 'PaymentRequest';
      break;
    case 'payment-receipt':
      baseFilename = 'PaymentReceipt';
      break;
  }

  // Add specific identifiers based on available data
  const parts = [baseFilename];

  // Add project name if available
  if (data.projectData?.name) {
    const projectName = data.projectData.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    parts.push(projectName);
  }

  // Add flat/unit number if available
  if (data.unitData?.flat_no) {
    const flatNo = data.unitData.flat_no.replace(/[^a-zA-Z0-9]/g, '_');
    parts.push(`Flat${flatNo}`);
  }

  // Add client name if available
  if (data.clientData?.name) {
    const clientName = data.clientData.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
    parts.push(clientName);
  }

  // Add specific payment request/receipt info
  if (templateType === 'payment-request' && data.paymentRequests && data.paymentRequests.length > 0) {
    const request = data.paymentRequests[0];
    if (request.sr_no) {
      parts.push(`SR${request.sr_no}`);
    }
  }

  if (templateType === 'payment-receipt' && data.paymentReceipts && data.paymentReceipts.length > 0) {
    const receipt = data.paymentReceipts[0];
    if (receipt.sr_no) {
      parts.push(`SR${receipt.sr_no}`);
    }
  }

  // Add timestamp
  parts.push(`${timestamp}_${time}`);

  return `${parts.join('_')}.pdf`;
};

/**
 * Replace placeholders in template content with actual data
 */
export const replacePlaceholders = (content: string, data: TemplateData): string => {
  let result = content;

  // Replace unit-related placeholders
  if (data.unitData) {
    result = result.replace(/\{\{FLAT_NO\}\}/g, data.unitData.flat_no || '');
    result = result.replace(/\{\{AREA_SQFT\}\}/g, data.unitData.area_sqft?.toString() || '');
    result = result.replace(/\{\{RATE_PER_SQFT\}\}/g, data.unitData.rate_per_sqft?.toString() || '');
    result = result.replace(/\{\{FLAT_VALUE\}\}/g, formatCurrency(data.unitData.flat_value || 0));
    result = result.replace(/\{\{RECEIVED_AMOUNT\}\}/g, formatCurrency(data.unitData.received_amount || 0));
    result = result.replace(/\{\{BALANCE_AMOUNT\}\}/g, formatCurrency(data.unitData.balance_amount || 0));
    result = result.replace(/\{\{FLAT_TYPE\}\}/g, data.unitData.type || '');
  }

  // Replace client-related placeholders
  if (data.clientData) {
    result = result.replace(/\{\{CLIENT_NAME\}\}/g, data.clientData.name || '');
    result = result.replace(/\{\{CLIENT_ADDRESS\}\}/g, data.clientData.address || '');
    result = result.replace(/\{\{CLIENT_PAN\}\}/g, data.clientData.pan_no || '');
    result = result.replace(/\{\{CLIENT_GSTIN\}\}/g, data.clientData.gstin_no || '');
    result = result.replace(/\{\{CLIENT_CONTACT\}\}/g, data.clientData.contact_no || '');
    result = result.replace(/\{\{CLIENT_EMAIL\}\}/g, data.clientData.email || '');
  }

  // Replace project-related placeholders
  if (data.projectData) {
    result = result.replace(/\{\{PROJECT_NAME\}\}/g, data.projectData.name || '');
    result = result.replace(/\{\{PROJECT_ADDRESS\}\}/g, data.projectData.address || '');
    result = result.replace(/\{\{PROJECT_START_DATE\}\}/g, formatDate(data.projectData.start_date || 0));
    result = result.replace(/\{\{PROJECT_END_DATE\}\}/g, formatDate(data.projectData.end_date || 0));
    result = result.replace(/\{\{PROJECT_PROGRESS\}\}/g, `${data.projectData.progress || 0}%`);
    result = result.replace(/\{\{PROJECT_BUDGET\}\}/g, formatCurrency(data.projectData.total_budget || 0));
  }

  // Replace company-related placeholders
  if (data.companyData) {
    result = result.replace(/\{\{COMPANY_NAME\}\}/g, data.companyData.name || '');
    result = result.replace(/\{\{COMPANY_SALUTATION\}\}/g, data.companyData.salutation || '');
  } else {
    // If no company data is loaded (e.g., letterhead option is 'none'), replace with empty strings
    result = result.replace(/\{\{COMPANY_NAME\}\}/g, '');
    result = result.replace(/\{\{COMPANY_SALUTATION\}\}/g, '');
  }

  // Replace date placeholders
  result = result.replace(/\{\{CURRENT_DATE\}\}/g, formatDate(Date.now()));

  // Replace table placeholders
  result = result.replace(/\{\{PROJECT_MILESTONES_TABLE\}\}/g, generateProjectMilestonesTable(data));
  result = result.replace(/\{\{CUSTOMER_SCHEDULES_TABLE\}\}/g, generateCustomerSchedulesTable(data));
  result = result.replace(/\{\{PAYMENT_REQUESTS_TABLE\}\}/g, generatePaymentRequestsTable(data));
  result = result.replace(/\{\{PAYMENT_RECEIPTS_TABLE\}\}/g, generatePaymentReceiptsTable(data));
  result = result.replace(/\{\{PENDING_PAYMENTS_TABLE\}\}/g, generatePendingPaymentsTable(data));

  // Replace individual field placeholders

  // Current Payment Request fields (without index)
  if (data.paymentRequests && data.paymentRequests.length > 0) {
    const currentRequest = data.paymentRequests[0]; // Use the first one (should be the only one for specific exports)

    // Replace placeholders without index for the current payment request
    result = result.replace(/\{\{PAYMENT_REQUEST_SR_NO\}\}/g, currentRequest.sr_no?.toString() || '');
    result = result.replace(/\{\{PAYMENT_REQUEST_DATE\}\}/g, formatDate(currentRequest.date || 0));
    result = result.replace(/\{\{PAYMENT_REQUEST_DESCRIPTION\}\}/g, currentRequest.description || '');
    result = result.replace(/\{\{PAYMENT_REQUEST_AMOUNT\}\}/g, formatCurrency(currentRequest.amount || 0));

    // Also add simpler aliases for common fields
    result = result.replace(/\{\{AMOUNT\}\}/g, formatCurrency(currentRequest.amount || 0));
    result = result.replace(/\{\{DATE\}\}/g, formatDate(currentRequest.date || 0));
    result = result.replace(/\{\{DESCRIPTION\}\}/g, currentRequest.description || '');
  }

  // Project Milestones fields
  if (data.projectMilestones) {
    const milestoneRegex = /\{\{PROJECT_MILESTONE_([A-Z_]+)\[(\d+)\]\}\}/g;
    let match;

    while ((match = milestoneRegex.exec(result)) !== null) {
      const field = match[1];
      const index = parseInt(match[2], 10);

      if (index >= 0 && index < data.projectMilestones.length) {
        const milestone = data.projectMilestones[index];
        let value = '';

        switch (field) {
          case 'SR_NO':
            value = milestone.sr_no?.toString() || '';
            break;
          case 'NAME':
            value = milestone.milestone_name || '';
            break;
          case 'COMPLETION':
            value = `${milestone.completion_percentage || 0}%`;
            break;
          case 'STATUS':
            value = milestone.status || '';
            break;
        }

        result = result.replace(match[0], value);
      } else {
        result = result.replace(match[0], '');
      }
    }
  }

  // Customer Schedules fields
  if (data.customerSchedules) {
    const scheduleRegex = /\{\{CUSTOMER_SCHEDULE_([A-Z_]+)\[(\d+)\]\}\}/g;
    let match;

    while ((match = scheduleRegex.exec(result)) !== null) {
      const field = match[1];
      const index = parseInt(match[2], 10);

      if (index >= 0 && index < data.customerSchedules.length) {
        const schedule = data.customerSchedules[index];
        let value = '';

        switch (field) {
          case 'SR_NO':
            value = schedule.sr_no?.toString() || '';
            break;
          case 'MILESTONE':
            value = schedule.milestone || '';
            break;
          case 'COMPLETION':
            value = `${schedule.completion_percentage || 0}%`;
            break;
          case 'AMOUNT':
            value = formatCurrency(schedule.amount || 0);
            break;
          case 'STATUS':
            value = schedule.status || '';
            break;
        }

        result = result.replace(match[0], value);
      } else {
        result = result.replace(match[0], '');
      }
    }
  }

  // Payment Requests fields
  if (data.paymentRequests) {
    const requestRegex = /\{\{PAYMENT_REQUEST_([A-Z_]+)\[(\d+)\]\}\}/g;
    let match;

    while ((match = requestRegex.exec(result)) !== null) {
      const field = match[1];
      const index = parseInt(match[2], 10);

      if (index >= 0 && index < data.paymentRequests.length) {
        const request = data.paymentRequests[index];
        let value = '';

        switch (field) {
          case 'SR_NO':
            value = request.sr_no?.toString() || '';
            break;
          case 'DATE':
            value = formatDate(request.date || 0);
            break;
          case 'DESCRIPTION':
            value = request.description || '';
            break;
          case 'AMOUNT':
            value = formatCurrency(request.amount || 0);
            break;
          case 'STATUS':
            // Payment requests don't have a status field in the database
            value = '';
            break;
        }

        result = result.replace(match[0], value);
      } else {
        result = result.replace(match[0], '');
      }
    }
  }

  // Payment Receipts fields
  if (data.paymentReceipts) {
    // Handle specific payment receipt placeholders (for single receipt export)
    if (data.specificPaymentReceiptId) {
      const specificReceipt = data.paymentReceipts.find(r => r.id === data.specificPaymentReceiptId);
      if (specificReceipt) {
        result = result.replace(/\{\{PAYMENT_RECEIPT_SR_NO\}\}/g, specificReceipt.sr_no?.toString() || '');
        result = result.replace(/\{\{PAYMENT_RECEIPT_DATE\}\}/g, formatDate(specificReceipt.date || 0));
        result = result.replace(/\{\{PAYMENT_RECEIPT_DESCRIPTION\}\}/g, specificReceipt.description || '');
        result = result.replace(/\{\{PAYMENT_RECEIPT_AMOUNT\}\}/g, formatCurrency(specificReceipt.amount || 0));
        result = result.replace(/\{\{PAYMENT_RECEIPT_MODE\}\}/g, specificReceipt.mode || '');
        result = result.replace(/\{\{PAYMENT_RECEIPT_REMARKS\}\}/g, specificReceipt.remarks || '');
        // Add shorthand placeholders
        result = result.replace(/\{\{AMOUNT\}\}/g, formatCurrency(specificReceipt.amount || 0));
        result = result.replace(/\{\{DATE\}\}/g, formatDate(specificReceipt.date || 0));
        result = result.replace(/\{\{DESCRIPTION\}\}/g, specificReceipt.description || '');
      }
    }

    // Handle indexed payment receipt placeholders
    const receiptRegex = /\{\{PAYMENT_RECEIPT_([A-Z_]+)\[(\d+)\]\}\}/g;
    let match;

    while ((match = receiptRegex.exec(result)) !== null) {
      const field = match[1];
      const index = parseInt(match[2], 10);

      if (index >= 0 && index < data.paymentReceipts.length) {
        const receipt = data.paymentReceipts[index];
        let value = '';

        switch (field) {
          case 'SR_NO':
            value = receipt.sr_no?.toString() || '';
            break;
          case 'DATE':
            value = formatDate(receipt.date || 0);
            break;
          case 'DESCRIPTION':
            value = receipt.description || '';
            break;
          case 'AMOUNT':
            value = formatCurrency(receipt.amount || 0);
            break;
          case 'MODE':
            value = receipt.mode || '';
            break;
          case 'REMARKS':
            value = receipt.remarks || '';
            break;
        }

        result = result.replace(match[0], value);
      } else {
        result = result.replace(match[0], '');
      }
    }
  }

  // Pending Payments fields
  if (data.pendingPayments) {
    const pendingRegex = /\{\{PENDING_PAYMENT_([A-Z_]+)\[(\d+)\]\}\}/g;
    let match;

    while ((match = pendingRegex.exec(result)) !== null) {
      const field = match[1];
      const index = parseInt(match[2], 10);

      if (index >= 0 && index < data.pendingPayments.length) {
        const pending = data.pendingPayments[index];
        let value = '';

        switch (field) {
          case 'SR_NO':
            value = pending.sr_no?.toString() || '';
            break;
          case 'DATE':
            value = formatDate(pending.date || 0);
            break;
          case 'DESCRIPTION':
            value = pending.description || '';
            break;
          case 'AMOUNT':
            value = formatCurrency(pending.amount || 0);
            break;
          case 'STATUS':
            // Payment requests don't have a status field in the database
            value = '';
            break;
        }

        result = result.replace(match[0], value);
      } else {
        result = result.replace(match[0], '');
      }
    }
  }

  // Replace aggregated values
  if (data.paymentRequests) {
    const totalRequestsAmount = data.paymentRequests.reduce((sum, request) => sum + (request.amount || 0), 0);
    result = result.replace(/\{\{TOTAL_PAYMENT_REQUESTS_AMOUNT\}\}/g, formatCurrency(totalRequestsAmount));
    result = result.replace(/\{\{PAYMENT_REQUESTS_COUNT\}\}/g, data.paymentRequests.length.toString());
  } else {
    result = result.replace(/\{\{TOTAL_PAYMENT_REQUESTS_AMOUNT\}\}/g, formatCurrency(0));
    result = result.replace(/\{\{PAYMENT_REQUESTS_COUNT\}\}/g, '0');
  }

  if (data.paymentReceipts) {
    const totalReceiptsAmount = data.paymentReceipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
    result = result.replace(/\{\{TOTAL_PAYMENT_RECEIPTS_AMOUNT\}\}/g, formatCurrency(totalReceiptsAmount));
    result = result.replace(/\{\{PAYMENT_RECEIPTS_COUNT\}\}/g, data.paymentReceipts.length.toString());
  } else {
    result = result.replace(/\{\{TOTAL_PAYMENT_RECEIPTS_AMOUNT\}\}/g, formatCurrency(0));
    result = result.replace(/\{\{PAYMENT_RECEIPTS_COUNT\}\}/g, '0');
  }

  if (data.pendingPayments) {
    const totalPendingAmount = data.pendingPayments.reduce((sum, pending) => sum + (pending.amount || 0), 0);
    result = result.replace(/\{\{TOTAL_PENDING_PAYMENTS_AMOUNT\}\}/g, formatCurrency(totalPendingAmount));
    result = result.replace(/\{\{PENDING_PAYMENTS_COUNT\}\}/g, data.pendingPayments.length.toString());
  } else {
    result = result.replace(/\{\{TOTAL_PENDING_PAYMENTS_AMOUNT\}\}/g, formatCurrency(0));
    result = result.replace(/\{\{PENDING_PAYMENTS_COUNT\}\}/g, '0');
  }

  return result;
};

/**
 * Generate HTML table for project milestones
 */
const generateProjectMilestonesTable = (data: TemplateData): string => {
  if (!data.projectMilestones || data.projectMilestones.length === 0) {
    return '<p>No project milestones available.</p>';
  }

  let tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Milestone</th>
          <th>Completion %</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.projectMilestones.forEach(milestone => {
    tableHtml += `
      <tr>
        <td>${milestone.sr_no}</td>
        <td>${milestone.milestone_name}</td>
        <td>${milestone.completion_percentage}%</td>
        <td>${milestone.status}</td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  return tableHtml;
};

/**
 * Generate HTML table for customer schedules
 */
const generateCustomerSchedulesTable = (data: TemplateData): string => {
  if (!data.customerSchedules || data.customerSchedules.length === 0) {
    return '<p>No customer schedules available.</p>';
  }

  let tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Milestone</th>
          <th>Completion %</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.customerSchedules.forEach(schedule => {
    tableHtml += `
      <tr>
        <td>${schedule.sr_no}</td>
        <td>${schedule.milestone}</td>
        <td>${schedule.completion_percentage}%</td>
        <td>${formatCurrency(schedule.amount || 0)}</td>
        <td>${schedule.status}</td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  return tableHtml;
};

/**
 * Generate HTML table for payment requests
 */
const generatePaymentRequestsTable = (data: TemplateData): string => {
  if (!data.paymentRequests || data.paymentRequests.length === 0) {
    return '<p>No payment requests available.</p>';
  }

  let tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.paymentRequests.forEach(request => {
    tableHtml += `
      <tr>
        <td>${request.sr_no}</td>
        <td>${formatDate(request.date || 0)}</td>
        <td>${request.description}</td>
        <td>${formatCurrency(request.amount || 0)}</td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  return tableHtml;
};

/**
 * Generate HTML table for payment receipts
 */
const generatePaymentReceiptsTable = (data: TemplateData): string => {
  if (!data.paymentReceipts || data.paymentReceipts.length === 0) {
    return '<p>No payment receipts available.</p>';
  }

  let tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Mode</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.paymentReceipts.forEach(receipt => {
    tableHtml += `
      <tr>
        <td>${receipt.sr_no}</td>
        <td>${formatDate(receipt.date || 0)}</td>
        <td>${receipt.description}</td>
        <td>${formatCurrency(receipt.amount || 0)}</td>
        <td>${receipt.mode}</td>
        <td>${receipt.remarks}</td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  return tableHtml;
};

/**
 * Generate HTML table for pending payments
 */
const generatePendingPaymentsTable = (data: TemplateData): string => {
  if (!data.pendingPayments || data.pendingPayments.length === 0) {
    return '<p>No pending payments available.</p>';
  }

  let tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.pendingPayments.forEach(pending => {
    tableHtml += `
      <tr>
        <td>${pending.sr_no}</td>
        <td>${formatDate(pending.date || 0)}</td>
        <td>${pending.description}</td>
        <td>${formatCurrency(pending.amount || 0)}</td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  return tableHtml;
};

/**
 * Generate HTML content for the template
 */
const generateTemplateHtml = (data: TemplateData): string => {
  // Replace placeholders in template content with actual data
  const replacedContent = replacePlaceholders(data.template.content, data);

  // Generate letterhead section if available and letterhead is enabled
  let letterheadHtml = '';
  if (data.companyLetterheadBase64 && data.companyLetterheadType === 'image') {
    letterheadHtml = `
      <div class="letterhead" style="text-align: center; margin-bottom: 20px;">
        <img src="${data.companyLetterheadBase64}" style="max-width: 100%; max-height: 150px;" />
      </div>
    `;
  } else if (data.companyData && data.companyLetterheadBase64) {
    // Only add company name as header if we have letterhead data (meaning letterhead was requested)
    letterheadHtml = `
      <div class="letterhead-text" style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin-bottom: 5px;">${data.companyData.name || 'Company Name'}</h1>
        ${data.companyData.salutation ? `<p style="margin-top: 5px;">${data.companyData.salutation}</p>` : ''}
      </div>
    `;
  }
  // If letterhead option is 'none', letterheadHtml will remain empty

  // Format the content for HTML rendering
  const formattedHtmlContent = formatContentForHtml(replacedContent);

  // Generate HTML content for the template with letterhead
  const htmlContent = `
    <html>
      <head>
        <title>${data.template.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            ${letterheadHtml ? '' : 'padding-top: 170px;'} /* Add 150px + 20px existing padding when no letterhead */
          }
          h1, h2, h3 {
            margin-top: 1em;
            margin-bottom: 0.5em;
            font-weight: bold;
          }
          h1 { font-size: 2em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.17em; }
          p {
            margin-bottom: 1em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
        </style>
      </head>
      <body>
        ${letterheadHtml}
        ${formattedHtmlContent}
      </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Formats plain text content with markdown-like syntax into HTML.
 * Supports:
 * - Headings (#, ##, ###)
 * - Paragraphs (double line breaks)
 * - Line breaks (single line breaks)
 */
const applyMarkdownFormatting = (text: string): string => {
  let result = text;

  // Replace headings
  result = result
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // Replace single line breaks with <br/>
  result = result.replace(/\n/g, '<br/>');

  return result;
};

/**
 * Formats plain text content with markdown-like syntax into HTML.
 * Supports:
 * - Headings (#, ##, ###)
 * - Paragraphs (double line breaks)
 * - Line breaks (single line breaks)
 * - Alignment (~left~, ~center~, ~right~)
 */
const formatContentForHtml = (content: string): string => {
  let formattedContent = content;

  // 1. Process alignment blocks first
  formattedContent = formattedContent.replace(
    /~(center|right|left)~([\s\S]*?)~\/\1~/g,
    (_match, alignType, innerContent) => {
      // Apply markdown formatting to the content inside the alignment block
      const processedInnerContent = applyMarkdownFormatting(innerContent);
      return `<div style="text-align: ${alignType};">${processedInnerContent}</div>`;
    }
  );

  // 2. Split by double newlines to get paragraphs for the remaining content
  const paragraphs = formattedContent.split(/\n\s*\n/);

  formattedContent = paragraphs.map(p => {
    const trimmedP = p.trim();
    if (trimmedP === '') {
      return ''; // Skip empty paragraphs
    }
    // If the paragraph is already wrapped in a block-level element (like div for alignment), don't wrap in <p>
    // Headings not inside alignment blocks will be handled by applyMarkdownFormatting on the full content later.
    if (trimmedP.startsWith('<div style="text-align: center;"') || trimmedP.startsWith('<div style="text-align: right;"') || trimmedP.startsWith('<div style="text-align: left;"')) {
      return trimmedP; // Already formatted, just return
    }
    // For regular paragraphs, apply markdown formatting (headings, line breaks) and wrap in <p>
    return `<p>${applyMarkdownFormatting(trimmedP)}</p>`;
  }).join('\n');

  return formattedContent;
};
