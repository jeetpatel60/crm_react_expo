/**
 * Format a number as currency (INR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date as a string
 */
export const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
