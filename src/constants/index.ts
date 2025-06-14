export * from './theme';

export const APP_NAME = 'SAMVIDA';

export const TASK_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const TASK_STATUS_COLORS = {
  pending: '#F59E0B', // Amber
  in_progress: '#3B82F6', // Blue
  completed: '#10B981', // Green
  cancelled: '#6B7280', // Gray
};

export const LEAD_STATUS_OPTIONS = [
  { label: 'Lead', value: 'Lead' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Quote Given', value: 'Quote Given' },
  { label: 'Converted', value: 'Converted' },
];

export const LEAD_STATUS_COLORS = {
  Lead: '#F59E0B', // Amber
  Contacted: '#3B82F6', // Blue
  'Quote Given': '#8B5CF6', // Purple
  Converted: '#10B981', // Green
};

export const PROJECT_STATUS_OPTIONS = [
  { label: 'Not Started', value: 'Not Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
];

export const PROJECT_STATUS_COLORS = {
  'Not Started': '#F59E0B', // Amber
  'In Progress': '#3B82F6', // Blue
  'Completed': '#10B981', // Green
};

export const MILESTONE_STATUS_OPTIONS = [
  { label: 'Not Started', value: 'Not Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
];

export const MILESTONE_STATUS_COLORS = {
  'Not Started': '#F59E0B', // Amber
  'In Progress': '#3B82F6', // Blue
  'Completed': '#10B981', // Green
};

export const UNIT_STATUS_OPTIONS = [
  { label: 'Available', value: 'Available' },
  { label: 'Booked', value: 'Booked' },
  { label: 'Sold', value: 'Sold' },
];

export const UNIT_STATUS_COLORS = {
  'Available': '#10B981', // Green
  'Booked': '#3B82F6', // Blue
  'Sold': '#6B7280', // Gray
};

export const UNIT_TYPE_OPTIONS = [
  { label: '1 RK', value: '1 RK' },
  { label: '1 BHK', value: '1 BHK' },
  { label: '1.5 BHK', value: '1.5 BHK' },
  { label: '2 BHK', value: '2 BHK' },
  { label: '2.5 BHK', value: '2.5 BHK' },
  { label: '3 BHK', value: '3 BHK' },
  { label: '3.5 BHK', value: '3.5 BHK' },
  { label: '4 BHK', value: '4 BHK' },
  { label: '4.5 BHK', value: '4.5 BHK' },
  { label: '5 BHK', value: '5 BHK' },
  { label: '5.5 BHK', value: '5.5 BHK' },
  { label: '6 BHK', value: '6 BHK' },
];

export const UNIT_CATEGORY_OPTIONS = [
  { label: 'Flat', value: 'Flat' },
  { label: 'Shop', value: 'Shop' },
  { label: 'Office', value: 'Office' },
];

export const UNIT_CUSTOMER_SCHEDULE_STATUS_OPTIONS = [
  { label: 'Not Started', value: 'Not Started' },
  { label: 'Payment Requested', value: 'Payment Requested' },
  { label: 'Payment Received', value: 'Payment Received' },
];

export const UNIT_CUSTOMER_SCHEDULE_STATUS_COLORS = {
  'Not Started': '#F59E0B', // Amber
  'Payment Requested': '#3B82F6', // Blue
  'Payment Received': '#10B981', // Green
};
