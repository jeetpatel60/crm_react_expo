export * from './theme';

export const APP_NAME = 'CRM App';

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
