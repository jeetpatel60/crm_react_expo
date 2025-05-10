import { Contact } from '../database/contactsDb';
import { Task } from '../database/tasksDb';
import { Company } from '../database/companiesDb';
import { Client } from '../database/clientsDb';
import { Lead } from '../database/leadsDb';
import { Project } from '../database/projectsDb';
import { ProjectSchedule, Milestone } from '../database/projectSchedulesDb';

export type { Contact, Task, Company, Client, Lead, Project, ProjectSchedule, Milestone };

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
  ProjectDetails: { projectId: number };
  AddProject: undefined;
  EditProject: { project: Project };
  ProjectScheduleDetails: { scheduleId: number };
  AddProjectSchedule: undefined;
  EditProjectSchedule: { schedule: ProjectSchedule };
  AddMilestone: { scheduleId: number };
  EditMilestone: { milestone: Milestone };
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
  Contacts: undefined;
  Tasks: undefined;
  Settings: undefined;
};
