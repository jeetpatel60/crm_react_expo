import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

import { Client, Company } from '../types';
import { ClientWithDetails } from '../database/clientsDb';
import { formatCurrency, formatDate } from './formatters';
import { getCompanyById } from '../database/companiesDb';

export type RecordType = 'all' | 'white' | 'black';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'request' | 'receipt' | 'sales';
  amount: number;
  mode?: string;
  remarks?: string;
}

interface CustomerLedgerData {
  client: Client | ClientWithDetails;
  ledgerEntries: LedgerEntry[];
  balanceAmount: number;
  totalAmountReceived?: number;
  flatValue?: number;
  totalBalancePayable?: number;
  company?: Company;
  generatedAt: number; // timestamp
  companyLetterheadBase64?: string;
  companyLetterheadType?: 'image' | 'pdf';
  recordType?: RecordType;
}

/**
 * Generate HTML content for the customer ledger report
 */
const generateCustomerLedgerHtml = (data: CustomerLedgerData, letterheadOption?: 'none' | 'company'): string => {
  const { client, ledgerEntries, balanceAmount, totalAmountReceived, flatValue, totalBalancePayable, company, generatedAt, recordType } = data;

  // Generate letterhead section if company is provided and letterhead is requested
  let letterheadHtml = '';
  if (company && letterheadOption === 'company') {
    // Check if we have a base64 encoded image
    if (data.companyLetterheadBase64 && data.companyLetterheadType === 'image') {
      // Use the base64 encoded image for the letterhead
      letterheadHtml = `
        <div class="letterhead">
          <img src="${data.companyLetterheadBase64}" style="max-width: 100%; max-height: 150px;" />
        </div>
      `;
      console.log('Using letterhead image in HTML');
    } else {
      // If no letterhead or processing failed, use company name as header
      letterheadHtml = `
        <div class="letterhead-text">
          <h1>${company.name || 'Company Name'}</h1>
          ${company.salutation ? `<p>${company.salutation}</p>` : ''}
        </div>
      `;
      console.log('Using company name as header (no letterhead image)');
    }
  }
  // If letterheadOption is 'none', letterheadHtml will remain empty

  // Generate flat value section with appropriate label based on record type
  const flatValueHtml = flatValue ? `
    <div class="flat-value-section">
      <div class="flat-value-row">
        <span class="flat-value-label">${recordType === 'white' ? 'Sales Value:' : recordType === 'black' ? 'B Value:' : 'Flat Value:'}</span>
        <span class="flat-value-amount">${formatCurrency(flatValue)}</span>
      </div>
    </div>
  ` : '';

  // Generate ledger entries table
  let ledgerTableHtml = '';
  if (ledgerEntries.length > 0) {
    ledgerTableHtml = `
      <table class="ledger-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
    `;

    ledgerEntries.forEach(entry => {
      let detailsHtml = '';

      // Only show receipt details for receipt entries
      if (entry.type === 'receipt' && (entry.mode || entry.remarks)) {
        detailsHtml = `${entry.mode ? `Mode: ${entry.mode}` : ''}${entry.mode && entry.remarks ? '<br>' : ''}${entry.remarks ? `Remarks: ${entry.remarks}` : ''}`;
      }

      // Determine the CSS class and sign based on entry type
      let cssClass = 'receipt-amount';
      let sign = '+ ';

      if (entry.type === 'sales') {
        cssClass = 'request-amount';
        sign = '- ';
      } else if (entry.type === 'request') {
        cssClass = 'request-amount';
        sign = '- ';
      }

      ledgerTableHtml += `
        <tr>
          <td>${entry.type === 'sales' ? '' : entry.date}</td>
          <td>${entry.description}</td>
          <td class="${cssClass}">
            ${sign}${formatCurrency(entry.amount)}
          </td>
          <td class="details-cell">${detailsHtml}</td>
        </tr>
      `;
    });

    ledgerTableHtml += `
        </tbody>
      </table>
    `;
  } else {
    ledgerTableHtml = '<p class="no-data">No ledger entries found for this client.</p>';
  }

  // Generate balance section
  const balancePayableLabel = recordType === 'white'
    ? 'Total Balance Payable<br>of Sales Value:'
    : 'Total Balance Payable<br>of B Value:'; // Changed from "Flat Value" to "B Value" for black records

  let balanceHtml = '';

  if (recordType === 'all') {
    // Original balance section for "All Records"
    balanceHtml = `
      <div class="balance-section">
        <div class="balance-row">
          <span class="balance-label">Balance Amount:</span>
          <span class="balance-amount ${balanceAmount >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(balanceAmount)}
          </span>
        </div>
        ${totalAmountReceived !== undefined ? `
        <div class="balance-row">
          <span class="balance-label">Total Amount Received:</span>
          <span class="balance-amount positive">
            ${formatCurrency(totalAmountReceived)}
          </span>
        </div>
        ` : ''}
        ${totalBalancePayable !== undefined ? `
        <div class="balance-row">
          <span class="balance-label">Total Balance Payable<br>of Flat Value:</span>
          <span class="balance-amount ${totalBalancePayable >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(totalBalancePayable)}
          </span>
        </div>
        ` : ''}
      </div>
    `;
  } else {
    // New balance section for "White Only" and "Black Only"
    balanceHtml = `
      <div class="balance-section">
        ${totalAmountReceived !== undefined ? `
        <div class="balance-row">
          <span class="balance-label">Total Amount Received:</span>
          <span class="balance-amount" style="color: #4CAF50;">
            ${formatCurrency(totalAmountReceived)}
          </span>
        </div>
        ` : ''}
        ${totalBalancePayable !== undefined ? `
        <div class="balance-row">
          <span class="balance-label">${balancePayableLabel}</span>
          <span class="balance-amount" style="color: #2196F3;">
            ${formatCurrency(totalBalancePayable)}
          </span>
        </div>
        ` : ''}
      </div>
    `;
  }

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
          .letterhead img {
            max-width: 100%;
            max-height: 150px;
          }
          .letterhead-text {
            text-align: center;
            margin-bottom: 20px;
          }
          .letterhead-text h1 {
            margin: 0;
            color: #2c3e50;
          }
          .no-letterhead {
            margin-top: 150px;
          }
          .report-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
            text-align: center;
          }
          .report-subtitle {
            font-size: 16px;
            margin-bottom: 20px;
            color: #7f8c8d;
            text-align: center;
          }
          .client-info {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .flat-value-section {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #e8f5e8;
            border-radius: 5px;
            border-left: 4px solid #27ae60;
          }
          .flat-value-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .flat-value-label {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
          }
          .flat-value-amount {
            font-size: 18px;
            font-weight: bold;
            color: #27ae60;
          }
          .ledger-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .ledger-table th, .ledger-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .ledger-table th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .ledger-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .receipt-amount {
            color: #27ae60;
            font-weight: bold;
          }
          .request-amount {
            color: #e74c3c;
            font-weight: bold;
          }
          .details-cell {
            font-size: 12px;
            color: #7f8c8d;
            max-width: 200px;
            word-wrap: break-word;
          }
          .balance-section {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #ddd;
          }
          .balance-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
          }
          .balance-label {
            font-size: 18px;
            font-weight: bold;
          }
          .balance-amount {
            font-size: 20px;
            font-weight: bold;
          }
          .positive {
            color: #27ae60;
          }
          .negative {
            color: #e74c3c;
          }
          .no-data {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        ${letterheadHtml}

        <div class="report-title ${letterheadOption === 'none' ? 'no-letterhead' : ''}">Customer Ledger Report</div>
        <div class="report-subtitle">Generated on ${formatDate(generatedAt)}</div>

        <div class="client-info">
          <h3>Client: ${client.name}</h3>
          ${client.address ? `<p>Address: ${client.address}</p>` : ''}
          ${client.contact_no ? `<p>Contact: ${client.contact_no}</p>` : ''}
          ${client.email ? `<p>Email: ${client.email}</p>` : ''}
          ${(client as ClientWithDetails).project_name ? `<p>Project Name: ${(client as ClientWithDetails).project_name}</p>` : ''}
          ${(client as ClientWithDetails).flat_no ? `<p>Flat No: ${(client as ClientWithDetails).flat_no}</p>` : ''}
        </div>

        ${flatValueHtml}

        ${ledgerTableHtml}

        ${balanceHtml}

        <div class="footer">
          <p>This is a computer-generated document. No signature is required.</p>
          <p>Generated on ${new Date(generatedAt).toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate and share customer ledger report as PDF
 */
export const generateAndShareCustomerLedgerPdf = async (
  client: Client | ClientWithDetails,
  ledgerEntries: LedgerEntry[],
  balanceAmount: number,
  totalAmountReceived?: number,
  flatValue?: number,
  totalBalancePayable?: number,
  companyId?: number,
  letterheadOption?: 'none' | 'company',
  recordType?: RecordType
): Promise<void> => {
  try {
    console.log(`Starting PDF generation for client: ${client.name}, with company ID: ${companyId}`);
    const generatedAt = Date.now();

    // Keep all entries as they come from the screen (already properly filtered)
    const processedLedgerEntries = ledgerEntries;

    // Prepare data for PDF generation
    const data: CustomerLedgerData = {
      client,
      ledgerEntries: processedLedgerEntries,
      balanceAmount,
      totalAmountReceived,
      flatValue,
      totalBalancePayable,
      generatedAt,
      recordType
    };

    // If company ID is provided and letterhead is requested, fetch company data
    if (companyId && letterheadOption === 'company') {
      try {
        console.log(`Fetching company data for ID: ${companyId}`);
        const company = await getCompanyById(companyId);
        console.log(`Company data fetched:`, {
          id: company.id,
          name: company.name,
          hasLetterhead: !!company.letterhead_path,
          letterheadPath: company.letterhead_path
        });
        data.company = company;

        // Process letterhead if available
        if (company.letterhead_path) {
          try {
            console.log(`Processing letterhead from path: ${company.letterhead_path}`);
            const fileInfo = await FileSystem.getInfoAsync(company.letterhead_path);
            console.log(`File exists: ${fileInfo.exists}, File info:`, fileInfo);

            if (fileInfo.exists) {
              // Determine file type
              const extension = company.letterhead_path.split('.').pop()?.toLowerCase() || '';
              console.log(`File extension: ${extension}`);

              if (['jpg', 'jpeg', 'png'].includes(extension)) {
                data.companyLetterheadType = 'image';
                try {
                  const base64 = await FileSystem.readAsStringAsync(company.letterhead_path, {
                    encoding: FileSystem.EncodingType.Base64,
                  });
                  data.companyLetterheadBase64 = `data:image/${extension};base64,${base64}`;
                  console.log(`Letterhead processed as image/${extension}, Base64 length: ${base64.length}`);
                } catch (readError) {
                  console.error('Error reading file as base64:', readError);
                }
              } else if (extension === 'pdf') {
                data.companyLetterheadType = 'pdf';
                console.log('Letterhead is PDF format (cannot be embedded directly in HTML)');
                // We can't embed PDF letterhead directly in HTML
              } else {
                console.log(`Unsupported file extension: ${extension}`);
              }
            } else {
              console.log(`Letterhead file does not exist at path: ${company.letterhead_path}`);
            }
          } catch (error) {
            console.error('Error processing letterhead:', error);
          }
        } else {
          console.log('No letterhead path found for company');
        }
      } catch (error) {
        console.error('Error fetching company:', error);
      }
    }

    // Generate HTML content
    console.log('Generating HTML with data:', {
      hasCompany: !!data.company,
      companyName: data.company?.name,
      hasLetterheadPath: !!data.company?.letterhead_path,
      letterheadType: data.companyLetterheadType,
      hasBase64Data: !!data.companyLetterheadBase64,
      base64Length: data.companyLetterheadBase64?.length
    });

    const htmlContent = generateCustomerLedgerHtml(data, letterheadOption);

    // Log the first 200 characters of HTML to verify letterhead inclusion
    console.log('Generated HTML (first 200 chars):', htmlContent.substring(0, 200));

    // Generate PDF file
    console.log('Generating PDF from HTML...');
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Create a filename with timestamp and record type
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const recordTypeSuffix = recordType && recordType !== 'all' ? `_${recordType.toUpperCase()}` : '';
    const newUri = `${FileSystem.cacheDirectory}CustomerLedger_${client.name.replace(/\s+/g, '_')}${recordTypeSuffix}_${timestamp}.pdf`;

    // Copy the file to the new location with the timestamp in the name
    await FileSystem.copyAsync({
      from: uri,
      to: newUri
    });

    // Delete the original file
    await FileSystem.deleteAsync(uri, { idempotent: true });

    // Share the PDF file
    await shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating or sharing PDF:', error);
    Alert.alert('Error', 'Failed to generate or share PDF. Please try again.');
  }
};

// GST Report interfaces and types
interface GstReportEntry {
  id: string;
  date: string;
  remarks: string;
  credit: number;
  debit: number;
  srNo: number;
}

interface GstReportData {
  client: Client | ClientWithDetails;
  gstEntries: GstReportEntry[];
  totalGstValue: number;
  totalCredit: number;
  balanceToCollect: number;
  unitFlatNo: string;
  company?: Company;
  generatedAt: number;
  companyLetterheadBase64?: string;
  companyLetterheadType?: 'image' | 'pdf';
}

/**
 * Generate HTML content for the GST report
 */
const generateGstReportHtml = (data: GstReportData, letterheadOption?: 'none' | 'company'): string => {
  const {
    client,
    gstEntries,
    totalGstValue,
    totalCredit,
    balanceToCollect,
    unitFlatNo,
    company,
    generatedAt
  } = data;

  // Generate letterhead section if company is provided and letterhead is requested
  let letterheadHtml = '';
  if (company && letterheadOption === 'company') {
    if (data.companyLetterheadBase64 && data.companyLetterheadType === 'image') {
      letterheadHtml = `
        <div class="letterhead">
          <img src="${data.companyLetterheadBase64}" style="max-width: 100%; max-height: 150px;" />
        </div>
      `;
    } else {
      letterheadHtml = `
        <div class="letterhead-text">
          <h1>${company.name || 'Company Name'}</h1>
          ${company.salutation ? `<p>${company.salutation}</p>` : ''}
        </div>
      `;
    }
  }

  // Generate GST entries table
  const gstEntriesHtml = gstEntries.map(entry => `
    <tr>
      <td style="text-align: center;">${entry.srNo === 0 ? '-' : entry.srNo}</td>
      <td style="text-align: center;">${entry.date || '-'}</td>
      <td style="text-align: right; color: ${entry.debit > 0 ? '#F44336' : '#666'}; font-weight: ${entry.debit > 0 ? 'bold' : 'normal'};">
        ${entry.debit > 0 ? '₹' + entry.debit.toFixed(2) : '-'}
      </td>
      <td style="text-align: right; color: ${entry.credit > 0 ? '#4CAF50' : '#666'}; font-weight: ${entry.credit > 0 ? 'bold' : 'normal'};">
        ${entry.credit > 0 ? '₹' + entry.credit.toFixed(2) : '-'}
      </td>
      <td>${entry.remarks}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>GST Report - ${client.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          ${letterheadOption === 'none' ? 'padding-top: 150px;' : ''}
        }
        .letterhead {
          text-align: center;
          margin-bottom: 30px;
        }
        .letterhead-text {
          text-align: center;
          margin-bottom: 30px;
        }
        .letterhead-text h1 {
          margin: 0;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .client-info {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .gst-value {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #e3f2fd;
          border-radius: 5px;
          text-align: center;
        }
        .gst-value h3 {
          margin: 0;
          color: #1976d2;
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
          font-weight: bold;
        }
        .summary {
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px 0;
        }
        .summary-row.total {
          border-top: 2px solid #333;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${letterheadHtml}

      <div class="header">
        <h2>GST Report</h2>
      </div>

      <div class="client-info">
        <strong>Client:</strong> ${client.name}<br>
        <strong>Project:</strong> ${(client as ClientWithDetails).project_name || 'N/A'}<br>
        <strong>Flat:</strong> ${unitFlatNo}<br>
        ${client.email ? `<strong>Email:</strong> ${client.email}<br>` : ''}
        ${client.phone ? `<strong>Phone:</strong> ${client.phone}` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Date</th>
            <th style="color: #F44336;">Debit</th>
            <th style="color: #4CAF50;">Credit</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${gstEntriesHtml}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Total R. Amount:</span>
          <span style="color: #4CAF50; font-weight: bold;">₹${totalCredit.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Balance to be Collected:</span>
          <span style="color: ${balanceToCollect > 0 ? '#F44336' : '#4CAF50'}; font-weight: bold;">₹${balanceToCollect.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        Generated on ${new Date(generatedAt).toLocaleString()}
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate and share GST report as PDF
 */
export const generateAndShareGstReportPdf = async (
  client: Client | ClientWithDetails,
  gstEntries: GstReportEntry[],
  totalGstValue: number,
  totalCollectionAmount: number,
  totalReceivedAmount: number,
  totalBalanceAmount: number,
  overallGstBalance: number,
  unitFlatNo: string,
  companyId?: number,
  letterheadOption?: 'none' | 'company'
): Promise<void> => {
  try {
    console.log(`Starting GST Report PDF generation for client: ${client.name}, with company ID: ${companyId}`);
    const generatedAt = Date.now();

    // Prepare data for PDF generation
    const data: GstReportData = {
      client,
      gstEntries,
      totalGstValue,
      totalCredit: totalReceivedAmount,
      balanceToCollect: overallGstBalance,
      unitFlatNo,
      generatedAt
    };

    // If company ID is provided and letterhead is requested, fetch company data
    if (companyId && letterheadOption === 'company') {
      try {
        console.log(`Fetching company data for ID: ${companyId}`);
        const company = await getCompanyById(companyId);
        console.log(`Company data fetched:`, {
          id: company.id,
          name: company.name,
          hasLetterhead: !!company.letterhead_path,
          letterheadPath: company.letterhead_path
        });
        data.company = company;

        // Process letterhead if available
        if (company.letterhead_path) {
          try {
            console.log(`Processing letterhead from path: ${company.letterhead_path}`);
            const fileInfo = await FileSystem.getInfoAsync(company.letterhead_path);
            console.log(`File exists: ${fileInfo.exists}, File info:`, fileInfo);

            if (fileInfo.exists) {
              // Check if it's an image file
              const isImage = company.letterhead_path.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);

              if (isImage) {
                console.log('Processing as image letterhead');
                const base64 = await FileSystem.readAsStringAsync(company.letterhead_path, {
                  encoding: FileSystem.EncodingType.Base64,
                });

                // Determine the MIME type based on file extension
                const extension = company.letterhead_path.toLowerCase().split('.').pop();
                const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

                data.companyLetterheadBase64 = `data:${mimeType};base64,${base64}`;
                data.companyLetterheadType = 'image';
                console.log('Successfully processed image letterhead');
              } else {
                console.log('Letterhead file is not an image, using company name instead');
              }
            } else {
              console.log('Letterhead file does not exist, using company name instead');
            }
          } catch (letterheadError) {
            console.error('Error processing letterhead:', letterheadError);
            console.log('Falling back to company name for letterhead');
          }
        } else {
          console.log('No letterhead path found, using company name');
        }
      } catch (companyError) {
        console.error('Error fetching company data:', companyError);
        console.log('Proceeding without company letterhead');
      }
    }

    const htmlContent = generateGstReportHtml(data, letterheadOption);

    // Log the first 200 characters of HTML to verify letterhead inclusion
    console.log('Generated HTML (first 200 chars):', htmlContent.substring(0, 200));

    // Generate PDF file
    console.log('Generating PDF from HTML...');
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Create a filename with the format: GSTReport-{project name}-{client name}-{flat}-{current date}
    const now = new Date();
    const currentDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`; // DD-MM-YYYY format
    const projectName = (client as ClientWithDetails).project_name || 'Unknown';
    const clientName = client.name;
    const flatNo = unitFlatNo;

    // Sanitize filename components by removing special characters
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '');

    const filename = `GSTReport-${sanitize(projectName)}-${sanitize(clientName)}-${sanitize(flatNo)}-${currentDate}.pdf`;
    const newUri = `${FileSystem.cacheDirectory}${filename}`;

    // Copy the file to the new location with the timestamp in the name
    await FileSystem.copyAsync({
      from: uri,
      to: newUri
    });

    // Delete the original file
    await FileSystem.deleteAsync(uri, { idempotent: true });

    // Share the PDF file
    await shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating or sharing GST Report PDF:', error);
    Alert.alert('Error', 'Failed to generate or share GST Report PDF. Please try again.');
  }
};
