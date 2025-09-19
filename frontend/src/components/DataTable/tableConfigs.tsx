import type { TableColumn, FilterConfig } from './types';
import { createStatusRenderer, createDateRenderer, createCurrencyRenderer } from './utils';

// Job interface based on the existing structure
export interface Job {
  id: number;
  project_id: number;
  job_number: string;
  description: string;
  status: string;
  priority?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  project_name?: string;
  estimated_hours?: number;
  actual_hours?: number;
  budget?: number;
  cost?: number;
  assigned_to?: string;
}

// Column configuration for Jobs table
export const jobsTableColumns: TableColumn<Job>[] = [
  {
    key: 'job_number',
    label: 'Job #',
    sortable: true,
    width: 120,
    className: 'font-mono text-sm'
  },
  {
    key: 'description',
    label: 'Description',
    sortable: true,
    width: 250
  },
  {
    key: 'client_name',
    label: 'Client',
    sortable: true,
    width: 150
  },
  {
    key: 'project_name',
    label: 'Project',
    sortable: true,
    width: 180
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: 120,
    render: createStatusRenderer()
  },
  {
    key: 'priority',
    label: 'Priority',
    sortable: true,
    width: 100
  },
  {
    key: 'start_date',
    label: 'Start Date',
    sortable: true,
    width: 120,
    render: createDateRenderer()
  },
  {
    key: 'end_date',
    label: 'Due Date',
    sortable: true,
    width: 120,
    render: createDateRenderer()
  },
  {
    key: 'estimated_hours',
    label: 'Est. Hours',
    sortable: true,
    width: 100,
    className: 'text-right'
  },
  {
    key: 'actual_hours',
    label: 'Actual Hours',
    sortable: true,
    width: 100,
    className: 'text-right'
  },
  {
    key: 'budget',
    label: 'Budget',
    sortable: true,
    width: 120,
    render: createCurrencyRenderer(),
    className: 'text-right'
  },
  {
    key: 'assigned_to',
    label: 'Assigned To',
    sortable: true,
    width: 150
  }
];

// Filter configuration for Jobs table
export const jobsTableFilters: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search jobs...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'on-hold', label: 'On Hold' }
    ]
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'critical', label: 'Critical' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ]
  },
  {
    key: 'client_name',
    label: 'Client',
    type: 'text',
    placeholder: 'Filter by client...'
  },
  {
    key: 'start_date_from',
    label: 'Start Date From',
    type: 'date'
  },
  {
    key: 'start_date_to', 
    label: 'Start Date To',
    type: 'date'
  }
];

// Project interface based on existing structure
export interface Project {
  id: number;
  name: string;
  description: string;
  client_id: number;
  client_name?: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  budget?: number;
  actual_cost?: number;
  progress?: number;
  project_manager?: string;
  is_pinned?: boolean;
}

// Column configuration for Projects table
export const projectsTableColumns: TableColumn<Project>[] = [
  {
    key: 'name',
    label: 'Project Name',
    sortable: true,
    width: 200
  },
  {
    key: 'description',
    label: 'Description',
    sortable: true,
    width: 250
  },
  {
    key: 'client_name',
    label: 'Client',
    sortable: true,
    width: 150
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: 120,
    render: createStatusRenderer()
  },
  {
    key: 'start_date',
    label: 'Start Date',
    sortable: true,
    width: 120,
    render: createDateRenderer()
  },
  {
    key: 'end_date',
    label: 'End Date',
    sortable: true,
    width: 120,
    render: createDateRenderer()
  },
  {
    key: 'budget',
    label: 'Budget',
    sortable: true,
    width: 120,
    render: createCurrencyRenderer(),
    className: 'text-right'
  },
  {
    key: 'actual_cost',
    label: 'Actual Cost',
    sortable: true,
    width: 120,
    render: createCurrencyRenderer(),
    className: 'text-right'
  },
  {
    key: 'progress',
    label: 'Progress',
    sortable: true,
    width: 100,
    render: (value: number) => `${value || 0}%`,
    className: 'text-right'
  },
  {
    key: 'project_manager',
    label: 'Project Manager',
    sortable: true,
    width: 150
  }
];

// Filter configuration for Projects table
export const projectsTableFilters: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search projects...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'planning', label: 'Planning' },
      { value: 'archived', label: 'Archived' }
    ]
  },
  {
    key: 'client_name',
    label: 'Client',
    type: 'text',
    placeholder: 'Filter by client...'
  },
  {
    key: 'pinned_only',
    label: 'Pinned Only',
    type: 'checkbox',
    placeholder: 'Show only pinned projects'
  }
];

// Client interface based on existing structure
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  abn?: string;
  status: string;
  created_at: string;
  updated_at: string;
  contact_person?: string;
  website?: string;
  notes?: string;
}

// Column configuration for Clients table
export const clientsTableColumns: TableColumn<Client>[] = [
  {
    key: 'name',
    label: 'Client Name',
    sortable: true,
    width: 200
  },
  {
    key: 'contact_person',
    label: 'Contact Person',
    sortable: true,
    width: 150
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    width: 180,
    className: 'text-blue-600 hover:underline'
  },
  {
    key: 'phone',
    label: 'Phone',
    sortable: true,
    width: 130,
    className: 'font-mono'
  },
  {
    key: 'abn',
    label: 'ABN',
    sortable: true,
    width: 120,
    className: 'font-mono'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: 120,
    render: createStatusRenderer()
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    width: 120,
    render: createDateRenderer()
  }
];

// Filter configuration for Clients table
export const clientsTableFilters: FilterConfig[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search clients...'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  }
];