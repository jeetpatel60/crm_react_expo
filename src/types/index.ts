import { Contact } from '../database/contactsDb';
import { Task } from '../database/tasksDb';
import { Company } from '../database/companiesDb';
import { Client } from '../database/clientsDb';
import { Lead } from '../database/leadsDb';

export type { Contact, Task, Company, Client, Lead };

export type RootStackParamList = {
  Home: undefined;
  ContactDetails: { contactId: number };
  AddContact: undefined;
  EditContact: { contact: Contact };
  TaskDetails: { taskId: number };
  AddTask: { contactId?: number };
  EditTask: { task: Task };
  CompanyDetails: { companyId: number };
  AddCompany: undefined;
  EditCompany: { company: Company };
  ClientDetails: { clientId: number };
  AddClient: undefined;
  EditClient: { client: Client };
  LeadDetails: { leadId: number };
  AddLead: undefined;
  EditLead: { lead: Lead };
};

export type DrawerParamList = {
  Dashboard: undefined;
  Company: undefined;
  Leads: undefined; // Added Leads option
  Clients: undefined;
  Projects: undefined;
  UnitsFlats: undefined;
  ProjectSchedules: undefined;
  Contacts: undefined;
  Tasks: undefined;
  Settings: undefined;
};
