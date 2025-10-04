import type { CSSProperties } from 'react';

// Status to color mapping for jobs and projects
export const statusColorMap: Record<string, string> = {
  // Job statuses
  'pending': 'yellow',
  'in-progress': 'blue', 
  'completed': 'green',
  'cancelled': 'red',
  'on-hold': 'orange',
  
  // Project statuses  
  'active': 'green',
  'inactive': 'gray',
  'planning': 'blue',
  'archived': 'gray',
  
  // Default fallback
  'default': 'gray'
};

// Get status badge styling
export const getStatusStyle = (status: string): CSSProperties => {
  const color = statusColorMap[status?.toLowerCase()] || statusColorMap.default;
  
  const colorMap = {
    yellow: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' },
    blue: { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #3b82f6' },
    green: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #10b981' },
    red: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #ef4444' },
    orange: { backgroundColor: '#fed7aa', color: '#9a3412', border: '1px solid #f97316' },
    gray: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #6b7280' }
  };
  
  return {
    ...colorMap[color as keyof typeof colorMap],
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    textAlign: 'center' as const,
    display: 'inline-block',
    minWidth: '60px'
  };
};

// Column-specific styling for different data types
export const getColumnStyle = (columnKey: string, value: any, _row?: any): CSSProperties => {
  const baseStyle: CSSProperties = {};
  
  // Status columns get special styling
  if (columnKey.toLowerCase().includes('status')) {
    return getStatusStyle(value);
  }
  
  // Priority columns
  if (columnKey.toLowerCase().includes('priority')) {
    const priorityColors = {
      'high': { color: '#dc2626', fontWeight: '600' },
      'medium': { color: '#d97706', fontWeight: '500' },
      'low': { color: '#059669', fontWeight: '400' },
      'critical': { color: '#991b1b', fontWeight: '700' }
    };
    
    const priority = value?.toLowerCase();
    if (priority && priorityColors[priority as keyof typeof priorityColors]) {
      return { ...baseStyle, ...priorityColors[priority as keyof typeof priorityColors] };
    }
  }
  
  // Date columns
  if (columnKey.toLowerCase().includes('date') || columnKey.toLowerCase().includes('due')) {
    const date = new Date(value);
    const now = new Date();
    const isOverdue = date < now && columnKey.toLowerCase().includes('due');
    
    if (isOverdue) {
      return { ...baseStyle, color: '#dc2626', fontWeight: '500' };
    }
    
    return { ...baseStyle, color: '#6b7280' };
  }
  
  // Numeric columns (budget, cost, etc.)
  if (typeof value === 'number' || (typeof value === 'string' && value.match(/^\$?[\d,]+\.?\d*$/))) {
    return { ...baseStyle, textAlign: 'right' as const, fontFamily: 'monospace' };
  }
  
  // Email columns
  if (columnKey.toLowerCase().includes('email')) {
    return { ...baseStyle, color: '#2563eb', textDecoration: 'underline' };
  }
  
  // Phone columns
  if (columnKey.toLowerCase().includes('phone')) {
    return { ...baseStyle, fontFamily: 'monospace' };
  }
  
  // Boolean columns
  if (typeof value === 'boolean') {
    return { 
      ...baseStyle, 
      color: value ? '#059669' : '#dc2626',
      fontWeight: '500'
    };
  }
  
  return baseStyle;
};

// Format cell content based on column type
export const formatCellValue = (columnKey: string, value: any): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Date formatting
  if (columnKey.toLowerCase().includes('date')) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } catch {
      return value.toString();
    }
  }
  
  // Currency formatting
  if (columnKey.toLowerCase().includes('cost') || 
      columnKey.toLowerCase().includes('budget') || 
      columnKey.toLowerCase().includes('price')) {
    const num = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(num);
    }
  }
  
  // Boolean formatting
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Status formatting (capitalize)
  if (columnKey.toLowerCase().includes('status')) {
    return value.toString().charAt(0).toUpperCase() + value.toString().slice(1);
  }
  
  return value.toString();
};

// Create render function for status cells
export const createStatusRenderer = () => {
  return (value: string) => (
    <span style={getStatusStyle(value)}>
      {formatCellValue('status', value)}
    </span>
  );
};

// Create render function for date cells
export const createDateRenderer = () => {
  return (value: string) => formatCellValue('date', value);
};

// Create render function for currency cells
export const createCurrencyRenderer = () => {
  return (value: number | string) => formatCellValue('cost', value);
};

// Create render function for boolean cells
export const createBooleanRenderer = () => {
  return (value: boolean) => (
    <span style={{ color: value ? '#059669' : '#dc2626', fontWeight: '500' }}>
      {value ? 'Yes' : 'No'}
    </span>
  );
};