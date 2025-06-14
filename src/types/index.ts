import { Company } from '../database/companiesDb';
import { Client } from '../database/clientsDb';
import { Lead } from '../database/leadsDb';
import { Project } from '../database/projectsDb';
import { ProjectSchedule, Milestone } from '../database/projectSchedulesDb';
import { UnitFlat } from '../database/unitsFlatDb';
import { UnitCustomerSchedule } from '../database/unitCustomerSchedulesDb';
import { UnitPaymentRequest } from '../database/unitPaymentRequestsDb';
import { UnitPaymentReceipt } from '../database/unitPaymentReceiptsDb';
import { UnitGstRecord } from '../database/unitGstRecordsDb';
import { Quotation } from '../database/quotationsDb';
import { QuotationAnnexureItem } from '../database/quotationAnnexuresDb';
import { AgreementTemplate } from '../database/agreementTemplatesDb';
import { PaymentRequestTemplate } from '../database/paymentRequestTemplatesDb';
import { PaymentReceiptTemplate } from '../database/paymentReceiptTemplatesDb';

export type {
  Company,
  Client,
  Lead,
  Project,
  ProjectSchedule,
  Milestone,
  UnitFlat,
  UnitCustomerSchedule,
  UnitPaymentRequest,
  UnitPaymentReceipt,
  Quotation,
  QuotationAnnexureItem,
  AgreementTemplate,
  PaymentRequestTemplate,
  PaymentReceiptTemplate
};

export type RootStackParamList = {
  Home: undefined;
  CompanyDetails: { companyId: number };
  AddCompany: undefined;
  EditCompany: { company: Company };
  ClientDetails: { clientId: number };
  AddClient: undefined;
  EditClient: { client: Client };
  LeadDetails: { leadId: number };
  AddLead: undefined;
  EditLead: { lead: Lead };
  ProjectDetails: { projectId: number };
  AddProject: undefined;
  EditProject: { project: Project };
  ProjectScheduleDetails: { scheduleId: number };
  AddProjectSchedule: undefined;
  EditProjectSchedule: { schedule: ProjectSchedule };
  AddMilestone: { scheduleId: number };
  EditMilestone: { milestone: Milestone };
  TestMilestoneEdit: undefined;
  UnitFlatDetails: { unitId: number };
  AddUnitFlat: undefined;
  EditUnitFlat: { unit: UnitFlat };
  AddUnitCustomerSchedule: { unitId: number };
  EditUnitCustomerSchedule: { schedule: UnitCustomerSchedule };
  AddUnitPaymentRequest: { unitId: number };
  EditUnitPaymentRequest: { request: UnitPaymentRequest };
  AddUnitPaymentReceipt: { unitId: number; unitPaymentRequestId?: number; };
  EditUnitPaymentReceipt: { receipt: UnitPaymentReceipt };
  AddUnitGstRecord: { unitId: number };
  EditUnitGstRecord: { gstRecord: UnitGstRecord };
  QuotationDetails: { quotationId: number };
  AddQuotation: undefined;
  EditQuotation: { quotation: Quotation };
  AgreementTemplates: undefined;
  AgreementTemplateDetails: { templateId: number };
  AddAgreementTemplate: undefined;
  EditAgreementTemplate: { template: AgreementTemplate };
  PaymentRequestTemplates: undefined;
  PaymentRequestTemplateDetails: { templateId: number };
  AddPaymentRequestTemplate: undefined;
  EditPaymentRequestTemplate: { template: PaymentRequestTemplate };
  PaymentReceiptTemplates: undefined;
  PaymentReceiptTemplateDetails: { templateId: number };
  AddPaymentReceiptTemplate: undefined;
  EditPaymentReceiptTemplate: { template: PaymentReceiptTemplate };

  BackupManagement: undefined;
  HowToUseGuide: undefined;
};

export type DrawerParamList = {
  Dashboard: undefined;
  Company: undefined;
  Leads: undefined; // Added Leads option
  Quotation: undefined; // Added Quotation option
  Clients: undefined;
  Projects: undefined;
  UnitsFlats: undefined;
  ProjectSchedules: undefined;
  Templates: undefined; // Added Templates option
  Settings: undefined;
  Reports: undefined;
};

export type ReportsStackParamList = {
  ReportsLanding: undefined;
  CustomerLedgerReport: undefined;
  FlatsAvailabilityReport: undefined;
  GstReport: undefined;
};
