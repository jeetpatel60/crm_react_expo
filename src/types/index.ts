import { Contact } from '../database/contactsDb';
import { Task } from '../database/tasksDb';
import { Company } from '../database/companiesDb';
import { Client } from '../database/clientsDb';

export type { Contact, Task, Company, Client };

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
};

export type DrawerParamList = {
  Dashboard: undefined;
  Company: undefined;
  Clients: undefined;
  Projects: undefined;
  UnitsFlats: undefined;
  ProjectSchedules: undefined;
  Contacts: undefined;
  Tasks: undefined;
  Settings: undefined;
};
