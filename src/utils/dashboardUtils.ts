import {
  getLeads,
  getProjects,
  getClients,
  getUnitsFlats,
  getQuotations
} from '../database';
import { getUnitPaymentRequests } from '../database/unitPaymentRequestsDb';
import { getUnitPaymentReceipts } from '../database/unitPaymentReceiptsDb';
import { formatCurrency } from './formatters';
import { Lead, Project, UnitFlat, Client, Quotation, UnitPaymentRequest, UnitPaymentReceipt } from '../types';

export interface DashboardData {
  totalLeads: number;
  totalProjects: number;
  totalClients: number;
  totalUnits: number;
  totalRevenue: number;
  totalPendingAmount: number;
  leadsByStatus: { x: string; y: number; label?: string }[];
  projectsByStatus: { x: string; y: number; label?: string }[];
  unitsByStatus: { x: string; y: number; label?: string }[];
  revenueData: { x: string; y: number }[];
  unitsSoldPast6Weeks: { x: string; y: number }[];
  unitsSoldPast6Months: { x: string; y: number }[];
  projects: { id: number; name: string }[];
  recentActivities: {
    id: string | number;
    title: string;
    description?: string;
    timestamp: number;
    icon: string;
    iconColor?: string;
    iconBackground?: string;
  }[];
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    // Fetch data from database
    const leads = await getLeads();
    const projects = await getProjects();
    const clients = await getClients();
    const units = await getUnitsFlats();
    const quotations = await getQuotations();

    // Initialize empty arrays for payment data
    const paymentRequests: UnitPaymentRequest[] = [];
    const paymentReceipts: UnitPaymentReceipt[] = [];

    // Fetch payment requests and receipts for each unit
    for (const unit of units) {
      if (unit.id) {
        try {
          const unitRequests = await getUnitPaymentRequests(unit.id);
          const unitReceipts = await getUnitPaymentReceipts(unit.id);

          paymentRequests.push(...unitRequests);
          paymentReceipts.push(...unitReceipts);
        } catch (error) {
          console.error(`Error fetching payment data for unit ${unit.id}:`, error);
        }
      }
    }

    // Calculate KPIs
    const totalLeads = leads.length;
    const totalProjects = projects.length;
    const totalClients = clients.length;
    const totalUnits = units.length;

    // Calculate total revenue (sum of all received amounts)
    const totalRevenue = units.reduce((sum, unit) => sum + (unit.received_amount || 0), 0);

    // Calculate total pending amount (sum of all balance amounts)
    const totalPendingAmount = units.reduce((sum, unit) => sum + (unit.balance_amount || 0), 0);

    // Group leads by status
    const leadsByStatus = groupLeadsByStatus(leads);

    // Group projects by status
    const projectsByStatus = groupProjectsByStatus(projects);

    // Group units by status
    const unitsByStatus = groupUnitsByStatus(units);

    // Generate revenue data (monthly)
    const revenueData = await generateRevenueData();

    // Generate units sold in past 6 weeks
    const unitsSoldPast6Weeks = generateUnitsSoldPast6Weeks(units);

    // Generate units sold in past 6 months
    const unitsSoldPast6Months = generateUnitsSoldPast6Months(units);

    // Extract project data for filtering
    const projectsList = projects.map(project => ({
      id: project.id || 0,
      name: project.name
    }));

    // Generate recent activities
    const recentActivities = generateRecentActivities(
      leads,
      projects,
      units,
      clients,
      quotations,
      paymentRequests,
      paymentReceipts
    );

    return {
      totalLeads,
      totalProjects,
      totalClients,
      totalUnits,
      totalRevenue,
      totalPendingAmount,
      leadsByStatus,
      projectsByStatus,
      unitsByStatus,
      revenueData,
      unitsSoldPast6Weeks,
      unitsSoldPast6Months,
      projects: projectsList,
      recentActivities,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Helper functions
const groupLeadsByStatus = (leads: Lead[]) => {
  const statusCounts: Record<string, number> = {};

  leads.forEach((lead) => {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    x: status,
    y: count,
    label: `${status}: ${count}`,
  }));
};

const groupProjectsByStatus = (projects: Project[]) => {
  const statusCounts: Record<string, number> = {};

  projects.forEach((project) => {
    statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    x: status,
    y: count,
    label: `${status}: ${count}`,
  }));
};

const groupUnitsByStatus = (units: UnitFlat[]) => {
  const statusCounts: Record<string, number> = {};

  units.forEach((unit) => {
    statusCounts[unit.status] = (statusCounts[unit.status] || 0) + 1;
  });

  return Object.entries(statusCounts).map(([status, count]) => ({
    x: status,
    y: count,
    label: `${status}: ${count}`,
  }));
};

const generateRevenueData = async () => {
  const monthlyRevenue: Record<string, number> = {};
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);

  // Initialize all months with 0
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
    monthlyRevenue[monthKey] = 0;
  }

  try {
    // Get all units
    const units = await getUnitsFlats();

    // For each unit, get payment receipts and add to monthly totals
    for (const unit of units) {
      if (unit.id) {
        const receipts = await getUnitPaymentReceipts(unit.id);

        // Sum receipts by month
        receipts.forEach((receipt) => {
          const receiptDate = new Date(receipt.date);
          if (receiptDate >= sixMonthsAgo) {
            const monthKey = receiptDate.toLocaleDateString('en-US', { month: 'short' });
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (receipt.amount || 0);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error generating revenue data:', error);
  }

  return Object.entries(monthlyRevenue).map(([month, amount]) => ({
    x: month,
    y: amount,
  }));
};

// Generate data for units sold in the past 6 weeks
const generateUnitsSoldPast6Weeks = (units: UnitFlat[], projectId?: number): { x: string; y: number }[] => {
  const weeklySales: Record<string, number> = {};
  const now = new Date();
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(now.getDate() - 42); // 6 weeks = 42 days

  // Initialize all weeks with 0
  for (let i = 0; i < 6; i++) {
    const weekStart = new Date(sixWeeksAgo);
    weekStart.setDate(sixWeeksAgo.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekKey = `Week ${i + 1}`;
    weeklySales[weekKey] = 0;
  }

  // For demo purposes, let's add some sample data
  // In a real implementation, we would filter units based on their updated_at date
  weeklySales['Week 1'] = 2;
  weeklySales['Week 2'] = 1;
  weeklySales['Week 3'] = 3;
  weeklySales['Week 4'] = 2;
  weeklySales['Week 5'] = 4;
  weeklySales['Week 6'] = 3;

  // Filter units that were sold in the past 6 weeks
  const filteredUnits = units.filter(unit => {
    // Only include units with 'Sold' status
    if (unit.status !== 'Sold') return false;

    // Filter by project if projectId is provided
    if (projectId && unit.project_id !== projectId) return false;

    // Check if the unit was updated (sold) in the past 6 weeks
    const updatedDate = unit.updated_at ? new Date(unit.updated_at) : null;
    return updatedDate && updatedDate >= sixWeeksAgo;
  });

  // Group units by week - this would be used in a real implementation
  // For now, we'll use the sample data above
  /*
  filteredUnits.forEach(unit => {
    if (!unit.updated_at) return;

    const updatedDate = new Date(unit.updated_at);
    const weeksSinceStart = Math.floor((updatedDate.getTime() - sixWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000));

    if (weeksSinceStart >= 0 && weeksSinceStart < 6) {
      const weekKey = `Week ${weeksSinceStart + 1}`;
      weeklySales[weekKey] = (weeklySales[weekKey] || 0) + 1;
    }
  });
  */

  return Object.entries(weeklySales).map(([week, count]) => ({
    x: week,
    y: count
  }));
};

// Generate data for units sold in the past 6 months
const generateUnitsSoldPast6Months = (units: UnitFlat[], projectId?: number): { x: string; y: number }[] => {
  const monthlySales: Record<string, number> = {};
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);

  // Initialize all months with 0
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
    monthlySales[monthKey] = 0;
  }

  // For demo purposes, let's add some sample data
  // In a real implementation, we would filter units based on their updated_at date
  const months = Object.keys(monthlySales);
  monthlySales[months[0]] = 5;
  monthlySales[months[1]] = 3;
  monthlySales[months[2]] = 7;
  monthlySales[months[3]] = 4;
  monthlySales[months[4]] = 8;
  monthlySales[months[5]] = 6;

  // Filter units that were sold in the past 6 months
  const filteredUnits = units.filter(unit => {
    // Only include units with 'Sold' status
    if (unit.status !== 'Sold') return false;

    // Filter by project if projectId is provided
    if (projectId && unit.project_id !== projectId) return false;

    // Check if the unit was updated (sold) in the past 6 months
    const updatedDate = unit.updated_at ? new Date(unit.updated_at) : null;
    return updatedDate && updatedDate >= sixMonthsAgo;
  });

  // Group units by month - this would be used in a real implementation
  // For now, we'll use the sample data above
  /*
  filteredUnits.forEach(unit => {
    if (!unit.updated_at) return;

    const updatedDate = new Date(unit.updated_at);
    const monthKey = updatedDate.toLocaleDateString('en-US', { month: 'short' });

    if (monthlySales.hasOwnProperty(monthKey)) {
      monthlySales[monthKey] = (monthlySales[monthKey] || 0) + 1;
    }
  });
  */

  return Object.entries(monthlySales).map(([month, count]) => ({
    x: month,
    y: count
  }));
};

const generateRecentActivities = (
  leads: Lead[],
  projects: Project[],
  units: UnitFlat[],
  clients: Client[],
  quotations: Quotation[],
  paymentRequests: UnitPaymentRequest[],
  paymentReceipts: UnitPaymentReceipt[]
) => {
  const activities: any[] = [];

  // Add recent leads
  leads.slice(0, 5).forEach((lead) => {
    activities.push({
      id: `lead-${lead.id}`,
      title: `New Lead: ${lead.name}`,
      description: `Enquiry for ${lead.enquiry_for || 'N/A'} with budget ${formatCurrency(lead.budget || 0)}`,
      timestamp: lead.created_at || Date.now(),
      icon: 'account-convert',
      iconColor: '#3B82F6',
      iconBackground: 'rgba(59, 130, 246, 0.1)',
    });
  });

  // Add recent projects
  projects.slice(0, 5).forEach((project) => {
    activities.push({
      id: `project-${project.id}`,
      title: `Project Update: ${project.name}`,
      description: `Status: ${project.status}, Progress: ${project.progress}%`,
      timestamp: project.updated_at || Date.now(),
      icon: 'briefcase',
      iconColor: '#8B5CF6',
      iconBackground: 'rgba(139, 92, 246, 0.1)',
    });
  });

  // Add recent units/flats
  units.slice(0, 5).forEach((unit) => {
    activities.push({
      id: `unit-${unit.id}`,
      title: `Unit Update: ${unit.flat_no}`,
      description: `Status changed to ${unit.status}`,
      timestamp: unit.updated_at || Date.now(),
      icon: 'home',
      iconColor: '#10B981',
      iconBackground: 'rgba(16, 185, 129, 0.1)',
    });
  });

  // Add recent clients
  clients.slice(0, 5).forEach((client) => {
    activities.push({
      id: `client-${client.id}`,
      title: `New Client: ${client.name}`,
      timestamp: client.created_at || Date.now(),
      icon: 'account-tie',
      iconColor: '#F59E0B',
      iconBackground: 'rgba(245, 158, 11, 0.1)',
    });
  });

  // Add recent payment receipts
  paymentReceipts.slice(0, 5).forEach((receipt) => {
    activities.push({
      id: `receipt-${receipt.id}`,
      title: `Payment Received: ${formatCurrency(receipt.amount || 0)}`,
      description: `Receipt No: ${receipt.sr_no}`,
      timestamp: receipt.date || Date.now(),
      icon: 'cash-check',
      iconColor: '#10B981',
      iconBackground: 'rgba(16, 185, 129, 0.1)',
    });
  });

  // Sort by timestamp (newest first)
  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);
};
