import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

import { Quotation, QuotationAnnexureItem } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { getCompanyById } from '../database/companiesDb';
import { getProjectById } from '../database/projectsDb';
import { getLeadById } from '../database/leadsDb';
import { getUnitFlatById } from '../database/unitsFlatDb';
import { UnitPaymentRequest } from '../database/unitPaymentRequestsDb';
import { getPaymentRequestTemplateById } from '../database/paymentRequestTemplatesDb';
import { generateAndShareTemplateDocument } from './templateUtils';

interface QuotationPdfData {
  quotation: Quotation;
  annexureA: QuotationAnnexureItem[];
  annexureB: QuotationAnnexureItem[];
  annexureC: QuotationAnnexureItem[];
  projectName?: string;
  leadName?: string;
  flatNo?: string;
  companyName?: string;
  companyLetterheadBase64?: string;
  companyLetterheadType?: 'image' | 'pdf';
  companySalutation?: string;
}

/**
 * Generate PDF from quotation data and share it
 */
export const generateAndShareQuotationPdf = async (quotationId: number): Promise<void> => {
  try {
    // Prepare data for PDF generation
    const data = await prepareQuotationPdfData(quotationId);

    // Generate HTML content
    const htmlContent = generateQuotationHtml(data);

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Share the PDF file
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating or sharing PDF:', error);
    Alert.alert('Error', 'Failed to generate or share PDF. Please try again.');
  }
};

/**
 * Prepare all data needed for PDF generation
 */
const prepareQuotationPdfData = async (quotationId: number): Promise<QuotationPdfData> => {
  // Import required functions here to avoid circular dependencies
  const { getQuotationById } = require('../database/quotationsDb');
  const { getQuotationAnnexureA, getQuotationAnnexureB, getQuotationAnnexureC } = require('../database');

  // Fetch quotation data
  const quotation = await getQuotationById(quotationId);
  if (!quotation) {
    throw new Error('Quotation not found');
  }

  // Fetch annexure items
  const annexureA = await getQuotationAnnexureA(quotationId);
  const annexureB = await getQuotationAnnexureB(quotationId);
  const annexureC = await getQuotationAnnexureC(quotationId);

  // Fetch related entities
  let projectName, leadName, flatNo, companyName, companyLetterheadBase64, companyLetterheadType, companySalutation;

  if (quotation.project_id) {
    const project = await getProjectById(quotation.project_id);
    if (project) {
      projectName = project.name;
    }
  }

  if (quotation.lead_id) {
    const lead = await getLeadById(quotation.lead_id);
    if (lead) {
      leadName = lead.name;
    }
  }

  if (quotation.flat_id) {
    const flat = await getUnitFlatById(quotation.flat_id);
    if (flat) {
      flatNo = flat.flat_no;
    }
  }

  if (quotation.company_id) {
    const company = await getCompanyById(quotation.company_id);
    if (company) {
      companyName = company.name;
      companySalutation = company.salutation;

      // Process letterhead if available
      if (company.letterhead_path) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(company.letterhead_path);
          if (fileInfo.exists) {
            // Determine file type
            const extension = company.letterhead_path.split('.').pop()?.toLowerCase() || '';
            if (['jpg', 'jpeg', 'png'].includes(extension)) {
              companyLetterheadType = 'image';
              const base64 = await FileSystem.readAsStringAsync(company.letterhead_path, {
                encoding: FileSystem.EncodingType.Base64,
              });
              companyLetterheadBase64 = `data:image/${extension};base64,${base64}`;
            } else if (extension === 'pdf') {
              companyLetterheadType = 'pdf';
              // We can't embed PDF letterhead directly in HTML, so we'll use company name instead
            }
          }
        } catch (error) {
          console.error('Error processing letterhead:', error);
        }
      }
    }
  }

  return {
    quotation,
    annexureA,
    annexureB,
    annexureC,
    projectName,
    leadName,
    flatNo,
    companyName,
    companyLetterheadBase64,
    companyLetterheadType,
    companySalutation
  };
};

/**
 * Generate HTML content for the quotation PDF
 */
const generateQuotationHtml = (data: QuotationPdfData): string => {
  const {
    quotation,
    annexureA,
    annexureB,
    annexureC,
    projectName,
    leadName,
    flatNo,
    companyName,
    companyLetterheadBase64,
    companyLetterheadType,
    companySalutation
  } = data;

  // Generate letterhead section
  let letterheadHtml = '';
  if (companyLetterheadBase64 && companyLetterheadType === 'image') {
    letterheadHtml = `
      <div class="letterhead">
        <img src="${companyLetterheadBase64}" style="max-width: 100%; max-height: 150px;" />
      </div>
    `;
  } else {
    // If no letterhead or PDF letterhead, use company name as header
    letterheadHtml = `
      <div class="letterhead-text">
        <h1>${companyName || 'Company Name'}</h1>
        ${companySalutation ? `<p>${companySalutation}</p>` : ''}
      </div>
    `;
  }

  // Generate annexure tables
  const annexureAHtml = generateAnnexureTable('Annexure A', annexureA);
  const annexureBHtml = generateAnnexureTable('Annexure B', annexureB);
  const annexureCHtml = generateAnnexureTable('Annexure C', annexureC);

  // Calculate total amount
  const totalAmount = quotation.total_amount || 0;

  // Generate the complete HTML
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .letterhead {
            text-align: center;
            margin-bottom: 20px;
          }
          .letterhead-text {
            text-align: center;
            margin-bottom: 20px;
          }
          .letterhead-text h1 {
            margin: 0;
            color: #2c3e50;
          }
          .quotation-header {
            margin-bottom: 20px;
          }
          .quotation-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
          }
          .quotation-info {
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            width: 120px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f2f2f2;
            text-align: left;
            padding: 8px;
            border: 1px solid #ddd;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .table-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #2c3e50;
          }
          .total-amount {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
        </style>
      </head>
      <body>
        ${letterheadHtml}

        <div class="quotation-header">
          <div class="quotation-title">Quotation: ${quotation.quotation_no}</div>
          <div class="quotation-info">
            <div class="info-row">
              <div class="info-label">Date:</div>
              <div>${formatDate(quotation.date)}</div>
            </div>
            ${projectName ? `
              <div class="info-row">
                <div class="info-label">Project:</div>
                <div>${projectName}</div>
              </div>
            ` : ''}
            ${leadName ? `
              <div class="info-row">
                <div class="info-label">Lead:</div>
                <div>${leadName}</div>
              </div>
            ` : ''}
            ${flatNo ? `
              <div class="info-row">
                <div class="info-label">Flat No:</div>
                <div>${flatNo}</div>
              </div>
            ` : ''}
          </div>
        </div>

        ${annexureAHtml}
        ${annexureBHtml}
        ${annexureCHtml}

        <div class="total-amount">
          Total Amount: ${formatCurrency(totalAmount)}
        </div>

        <div class="footer">
          <p>This is a computer-generated document. No signature is required.</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate HTML table for annexure items
 */
const generateAnnexureTable = (title: string, items: QuotationAnnexureItem[]): string => {
  if (!items || items.length === 0) {
    return '';
  }

  const tableRows = items.map(item => `
    <tr>
      <td>${item.sr_no || ''}</td>
      <td>${item.description || ''}</td>
      <td style="text-align: right;">${formatCurrency(item.amount || 0)}</td>
    </tr>
  `).join('');

  return `
    <div class="table-title">${title}</div>
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
};

/**
 * Generate PDF from payment request data and share it
 *
 * @param paymentRequestId The ID of the payment request
 * @param templateId The ID of the payment request template to use
 * @param companyId Optional company ID to use for letterhead
 */
export const generateAndSharePaymentRequestPdf = async (
  paymentRequestId: number,
  templateId: number,
  companyId?: number
): Promise<void> => {
  try {
    // Get the payment request
    const { getUnitPaymentRequestById } = require('../database/unitPaymentRequestsDb');
    const paymentRequest = await getUnitPaymentRequestById(paymentRequestId);

    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    // Get the unit/flat
    const unitFlat = await getUnitFlatById(paymentRequest.unit_id);

    if (!unitFlat) {
      throw new Error('Unit/Flat not found');
    }

    // Get the project
    const project = await getProjectById(unitFlat.project_id);

    if (!project) {
      throw new Error('Project not found');
    }

    // If companyId is not provided, use the project's company_id
    const effectiveCompanyId = companyId || project.company_id;

    // Generate and share the document using the template
    await generateAndShareTemplateDocument(
      templateId,
      'payment-request',
      paymentRequest.unit_id,
      undefined,
      project.id,
      effectiveCompanyId,
      paymentRequestId,  // Pass the specific payment request ID
      undefined, // specificPaymentReceiptId
      'company', // letterheadOption - default to company for backward compatibility
      effectiveCompanyId // letterheadCompanyId
    );
  } catch (error) {
    console.error('Error generating or sharing payment request PDF:', error);
    Alert.alert('Error', 'Failed to generate or share payment request PDF. Please try again.');
  }
};