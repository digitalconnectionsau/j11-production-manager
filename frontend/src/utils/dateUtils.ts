/**
 * Centralized date formatting utilities
 */

/**
 * Default locale for the application
 */
export const DEFAULT_LOCALE = 'en-AU';

/**
 * Standard date formatting options
 */
export const DATE_FORMAT_OPTIONS = {
  short: { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  } as Intl.DateTimeFormatOptions,
  
  long: { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  } as Intl.DateTimeFormatOptions,
  
  withTime: { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  } as Intl.DateTimeFormatOptions
};

/**
 * Format a date string or Date object to a localized date string
 */
export const formatDate = (
  date: string | Date | null | undefined, 
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = DATE_FORMAT_OPTIONS.short
): string => {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString(locale, options);
  } catch {
    return '-';
  }
};

/**
 * Format a date with time
 */
export const formatDateTime = (
  date: string | Date | null | undefined,
  locale: string = DEFAULT_LOCALE
): string => {
  return formatDate(date, locale, DATE_FORMAT_OPTIONS.withTime);
};

/**
 * Format a date in long format (e.g., "January 15, 2024")
 */
export const formatDateLong = (
  date: string | Date | null | undefined,
  locale: string = DEFAULT_LOCALE
): string => {
  return formatDate(date, locale, DATE_FORMAT_OPTIONS.long);
};

/**
 * Check if a date is valid
 */
export const isValidDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  try {
    const d = new Date(date);
    return !isNaN(d.getTime());
  } catch {
    return false;
  }
};

/**
 * Check if a date is overdue (past current date)
 */
export const isOverdue = (date: string | Date | null | undefined): boolean => {
  if (!isValidDate(date)) return false;
  
  const d = new Date(date!);
  const now = new Date();
  
  // Reset time to compare only dates
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  return d < now;
};

/**
 * Get relative time (e.g., "2 days ago", "in 3 days")
 */
export const getRelativeTime = (
  date: string | Date | null | undefined,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) return '-';
  
  try {
    const d = new Date(date!);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      return rtf.format(diffHours, 'hour');
    }
    
    return rtf.format(diffDays, 'day');
  } catch {
    return '-';
  }
};

/**
 * Format date for HTML input[type="date"]
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!isValidDate(date)) return '';
  
  try {
    const d = new Date(date!);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Parse date from HTML input[type="date"] format
 */
export const parseDateFromInput = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Input format is YYYY-MM-DD, create date in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
};

/**
 * Get the start and end of today
 */
export const getToday = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get date range for common periods
 */
export const getDateRange = (period: 'today' | 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } => {
  const now = new Date();
  const today = getToday();
  
  switch (period) {
    case 'today':
      return today;
      
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week (Saturday)
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    }
    
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      return { start, end };
    }
    
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      
      return { start, end };
    }
    
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      return { start, end };
    }
    
    default:
      return today;
  }
};