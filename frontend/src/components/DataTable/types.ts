// Reusable Data Table Types
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  width?: number;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  cellStyle?: (row: T) => React.CSSProperties;
}

export interface FilterConfig {
  type: 'text' | 'select' | 'date' | 'dateRange' | 'checkbox' | 'multiSelect';
  label: string;
  key: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string | null;
  
  // Filtering
  filters?: FilterConfig[];
  onFiltersChange?: (filters: Record<string, any>) => void;
  
  // Sorting
  defaultSort?: SortConfig;
  onSortChange?: (sort: SortConfig) => void;
  
  // Row actions
  onRowClick?: (row: T) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  selectable?: boolean;
  
  // Column management
  columnPreferences?: any[];
  onColumnPreferencesChange?: (preferences: any[]) => void;
  resizableColumns?: boolean;
  
  // Styling
  className?: string;
  striped?: boolean;
  bordered?: boolean;
  
  // Empty state
  emptyMessage?: string;
  emptySubMessage?: string;
  
  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}

export interface StatusInfo {
  id: number;
  name: string;
  displayName: string;
  color: string;
  backgroundColor: string;
  isDefault: boolean;
  isFinal: boolean;
  targetColumns?: ColumnTarget[];
}

export interface ColumnTarget {
  column: string;
  color: string;
}