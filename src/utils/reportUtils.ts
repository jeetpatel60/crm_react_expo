import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

import { Client, Company } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { getCompanyById } from '../database/companiesDb';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'request' | 'receipt';
  amount: number;
}

interface CustomerLedgerData {
  client: Client;
  ledgerEntries: LedgerEntry[];
  balanceAmount: number;
  company?: Company;
  generatedAt: number; // timestamp
  companyLetterheadBase64?: string;
  companyLetterheadType?: 'image' | 'pdf';
}

/**
 * Generate HTML content for the customer ledger report
 */
const generateCustomerLedgerHtml = (data: CustomerLedgerData): string => {
  const { client, ledgerEntries, balanceAmount, company, generatedAt } = data;

  // Generate letterhead section if company is provided
  let letterheadHtml = '';
  if (company) {
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
          </tr>
        </thead>
        <tbody>
    `;

    ledgerEntries.forEach(entry => {
      ledgerTableHtml += `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.description}</td>
          <td class="${entry.type === 'receipt' ? 'receipt-amount' : 'request-amount'}">
            ${entry.type === 'receipt' ? '+' : '-'} ${formatCurrency(entry.amount)}
          </td>
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
  const balanceHtml = `
    <div class="balance-section">
      <div class="balance-row">
        <span class="balance-label">Balance Amount:</span>
        <span class="balance-amount ${balanceAmount >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(balanceAmount)}
        </span>
      </div>
    </div>
  `;

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

        <div class="report-title">Customer Ledger Report</div>
        <div class="report-subtitle">Generated on ${formatDate(generatedAt)}</div>

        <div class="client-info">
          <h3>Client: ${client.name}</h3>
          ${client.address ? `<p>Address: ${client.address}</p>` : ''}
          ${client.contact_no ? `<p>Contact: ${client.contact_no}</p>` : ''}
          ${client.email ? `<p>Email: ${client.email}</p>` : ''}
        </div>

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
  client: Client,
  ledgerEntries: LedgerEntry[],
  balanceAmount: number,
  companyId?: number
): Promise<void> => {
  try {
    console.log(`Starting PDF generation for client: ${client.name}, with company ID: ${companyId}`);
    const generatedAt = Date.now();

    // Prepare data for PDF generation
    const data: CustomerLedgerData = {
      client,
      ledgerEntries,
      balanceAmount,
      generatedAt
    };

    // If company ID is provided, fetch company data
    if (companyId) {
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

    const htmlContent = generateCustomerLedgerHtml(data);

    // Log the first 200 characters of HTML to verify letterhead inclusion
    console.log('Generated HTML (first 200 chars):', htmlContent.substring(0, 200));

    // Generate PDF file
    console.log('Generating PDF from HTML...');
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newUri = `${FileSystem.cacheDirectory}CustomerLedger_${client.name.replace(/\s+/g, '_')}_${timestamp}.pdf`;

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
