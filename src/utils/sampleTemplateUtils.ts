import * as FileSystem from 'expo-file-system';
import { addAgreementTemplate } from '../database/agreementTemplatesDb';

/**
 * Add a sample agreement template to the database
 */
export const addSampleAgreementTemplate = async (): Promise<number> => {
  try {
    // Read the sample agreement template file
    const fileUri = `${FileSystem.documentDirectory}sample_agreement.txt`;

    // First, write the sample template content directly
    const sampleContent = `AGREEMENT FOR SALE

THIS AGREEMENT FOR SALE is made and executed on this {{CURRENT_DATE}} by and between:

{{COMPANY_NAME}}
{{COMPANY_SALUTATION}}
(Hereinafter referred to as the "DEVELOPER")

AND

{{CLIENT_NAME}}
Address: {{CLIENT_ADDRESS}}
PAN: {{CLIENT_PAN}}
GSTIN: {{CLIENT_GSTIN}}
Contact: {{CLIENT_CONTACT}}
Email: {{CLIENT_EMAIL}}
(Hereinafter referred to as the "PURCHASER")

WHEREAS:

1. The DEVELOPER is the owner of the project known as "{{PROJECT_NAME}}" situated at {{PROJECT_ADDRESS}} (hereinafter referred to as the "PROJECT").

2. The PURCHASER has agreed to purchase and the DEVELOPER has agreed to sell the Unit/Flat No. {{FLAT_NO}}, Type: {{FLAT_TYPE}}, having a carpet area of {{AREA_SQFT}} square feet in the PROJECT (hereinafter referred to as the "UNIT").

3. The PURCHASER has agreed to pay a total consideration of {{FLAT_VALUE}} (Rupees) for the UNIT, calculated at the rate of {{RATE_PER_SQFT}} per square foot.

NOW THEREFORE, in consideration of the mutual promises and covenants contained herein, the parties hereby agree as follows:

1. SALE CONSIDERATION:
   a) The total sale consideration for the UNIT is {{FLAT_VALUE}}.
   b) The PURCHASER has already paid an amount of {{RECEIVED_AMOUNT}} to the DEVELOPER.
   c) The balance amount of {{BALANCE_AMOUNT}} shall be paid by the PURCHASER to the DEVELOPER as per the payment schedule attached hereto as Annexure A.

2. PAYMENT SCHEDULE:
   The PURCHASER shall make payments to the DEVELOPER as per the following schedule:

   {{CUSTOMER_SCHEDULES_TABLE}}

3. POSSESSION:
   The DEVELOPER shall hand over possession of the UNIT to the PURCHASER within {{PROJECT_END_DATE}} from the date of this Agreement, subject to timely payment of all dues by the PURCHASER.

4. PROJECT MILESTONES:
   The PROJECT shall be completed as per the following milestones:

   {{PROJECT_MILESTONES_TABLE}}

5. PAYMENT HISTORY:
   The PURCHASER has made the following payments to the DEVELOPER:

   {{PAYMENT_RECEIPTS_TABLE}}

6. PENDING PAYMENTS:
   The following payments are pending from the PURCHASER:

   {{PAYMENT_REQUESTS_TABLE}}

IN WITNESS WHEREOF, the parties hereto have set their hands on the day, month and year first above written.

DEVELOPER:
{{COMPANY_NAME}}

PURCHASER:
{{CLIENT_NAME}}`;

    await FileSystem.writeAsStringAsync(fileUri, sampleContent);

    // Read the file content
    const content = await FileSystem.readAsStringAsync(fileUri);

    // Add the template to the database
    const templateId = await addAgreementTemplate({
      name: 'Sample Agreement Template',
      content: content
    });

    // Clean up
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    return templateId;
  } catch (error) {
    console.error('Error adding sample agreement template:', error);
    throw error;
  }
};
