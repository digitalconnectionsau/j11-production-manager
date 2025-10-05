// Utility functions for calculating job dates based on lead times
export interface LeadTime {
  id: number;
  fromStatusId: number;
  toStatusId: number;
  days: number;
  direction: 'before' | 'after';
  isActive: boolean;
}

export interface JobStatus {
  id: number;
  name: string;
  displayName: string;
  color: string;
  backgroundColor: string;
  isDefault: boolean;
  isFinal: boolean;
}

// Helper function to add/subtract working days (excluding weekends)
export const addWorkingDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let daysToAdd = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  
  while (daysToAdd > 0) {
    result.setDate(result.getDate() + direction);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysToAdd--;
    }
  }
  
  return result;
};

// Helper function to format date as DD/MM/YYYY
export const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to parse DD/MM/YYYY to Date
export const parseDDMMYYYY = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  return new Date(year, month, day);
};

// Map status names to date field names
const statusToDateFieldMap: Record<string, string> = {
  'not-assigned': 'nestingDate',
  'nesting-complete': 'nestingDate',
  'machining-complete': 'machiningDate', 
  'assembly-complete': 'assemblyDate',
  'delivered': 'deliveryDate'
};

// Main function to calculate all dates based on delivery date and lead times
export const calculateJobDates = (
  deliveryDateString: string,
  leadTimes: LeadTime[],
  jobStatuses: JobStatus[]
): Record<string, string> => {
  const deliveryDate = parseDDMMYYYY(deliveryDateString);
  if (!deliveryDate) {
    throw new Error('Invalid delivery date format. Please use DD/MM/YYYY.');
  }

  // Find the delivery status (typically the final status)
  const deliveryStatus = jobStatuses.find(status => 
    status.name.toLowerCase() === 'delivered' || status.isFinal
  );
  
  if (!deliveryStatus) {
    throw new Error('Could not find delivery status in job statuses.');
  }

  const calculatedDates: Record<string, string> = {
    deliveryDate: deliveryDateString // Keep the original delivery date
  };

  // Calculate dates for each status based on lead times
  jobStatuses.forEach(status => {
    // Skip if this is the delivery status (already set)
    if (status.id === deliveryStatus.id) return;

    // Find lead time rule for this status relative to delivery status
    const leadTime = leadTimes.find(lt => 
      lt.fromStatusId === status.id && 
      lt.toStatusId === deliveryStatus.id && 
      lt.isActive
    );

    if (leadTime) {
      // Calculate the date based on lead time
      let calculatedDate: Date;
      
      if (leadTime.direction === 'before') {
        // X days before delivery
        calculatedDate = addWorkingDays(deliveryDate, -leadTime.days);
      } else {
        // X days after delivery (rare case)
        calculatedDate = addWorkingDays(deliveryDate, leadTime.days);
      }

      // Map status to the appropriate date field
      const dateField = statusToDateFieldMap[status.name];
      if (dateField) {
        calculatedDates[dateField] = formatDateToDDMMYYYY(calculatedDate);
      }
    }
  });

  return calculatedDates;
};