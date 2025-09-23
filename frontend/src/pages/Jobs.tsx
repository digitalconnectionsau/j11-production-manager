import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { DataTable } from '../components/DataTable';
import type { TableColumn, FilterConfig, SortConfig } from '../components/DataTable';
import { createStatusRenderer, createDateRenderer } from '../components/DataTable/utils';
import { apiRequest, API_ENDPOINTS } from '../utils/api';
import Button from '../components/ui/Button';
import ErrorDisplay from '../components/ErrorDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

interface Job {
  id: number;
  projectId: number;
  unit: string;
  type: string;
  items: string;
  nestingDate: string | null;
  machiningDate: string | null;
  assemblyDate: string | null;
  deliveryDate: string | null;
  status: string;
  statusId: number;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  projectName: string;
  clientName: string;
  statusInfo: {
    id: number;
    name: string;
    displayName: string;
    color: string;
    backgroundColor: string;
    isDefault: boolean;
    isFinal: boolean;
    targetColumns?: ColumnTarget[];
  } | null;
}

interface ColumnTarget {
  column: string;
  color: string;
}

interface Client {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  clientId: number;
}

interface JobStatus {
  id: number;
  name: string;
  displayName: string;
  color: string;
  backgroundColor: string;
  isDefault: boolean;
  isFinal: boolean;
}

interface JobsProps {
  onProjectSelect: (projectId: number, tab?: "jobs" | "info") => void;
  onJobSelect: (jobId: number) => void;
}

function Jobs({ onProjectSelect, onJobSelect }: JobsProps) {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    status: '',
    client: '',
    project: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Sorting state
  const [sort, setSort] = useState<SortConfig>({ field: 'id', direction: 'desc' });
  
  // Column preferences
  const { preferences, updatePreferences } = useColumnPreferences('jobs');

  // Define table columns
  const columns: TableColumn<Job>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: 80,
      className: 'font-mono text-sm'
    },
    {
      key: 'unit',
      label: 'Unit',
      sortable: true,
      width: 100
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: 120
    },
    {
      key: 'items',
      label: 'Items',
      sortable: true,
      width: 200
    },
    {
      key: 'clientName',
      label: 'Client',
      sortable: true,
      width: 150
    },
    {
      key: 'projectName',
      label: 'Project',
      sortable: true,
      width: 180,
      render: (value: string, row: Job) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProjectSelect(row.projectId);
          }}
          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
        >
          {value}
        </button>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 130,
      render: (value: string, row: Job) => {
        if (row.statusInfo) {
          return (
            <span
              onClick={(e) => handleStatusClick(e, row)}
              style={{
                backgroundColor: row.statusInfo.backgroundColor,
                color: row.statusInfo.color,
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'center',
                display: 'inline-block',
                minWidth: '80px',
                cursor: 'pointer'
              }}
              title="Click to change status"
            >
              {row.statusInfo.displayName}
            </span>
          );
        }
        return createStatusRenderer()(value);
      }
    },
    {
      key: 'nestingDate',
      label: 'Nesting Date',
      sortable: true,
      width: 130,
      render: createDateRenderer(),
      cellStyle: (row: Job) => getDateCellStyle('nestingDate', row)
    },
    {
      key: 'machiningDate',
      label: 'Machining Date',
      sortable: true,
      width: 140,
      render: createDateRenderer(),
      cellStyle: (row: Job) => getDateCellStyle('machiningDate', row)
    },
    {
      key: 'assemblyDate',
      label: 'Assembly Date',
      sortable: true,
      width: 140,
      render: createDateRenderer(),
      cellStyle: (row: Job) => getDateCellStyle('assemblyDate', row)
    },
    {
      key: 'deliveryDate',
      label: 'Delivery Date',
      sortable: true,
      width: 140,
      render: createDateRenderer(),
      cellStyle: (row: Job) => getDateCellStyle('deliveryDate', row)
    },
    {
      key: 'comments',
      label: 'Comments',
      sortable: true,
      width: 200,
      render: (value: string) => value || '-'
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      width: 120,
      render: createDateRenderer()
    }
  ];

  // Define filters
  const filterConfigs: FilterConfig[] = [
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
        ...jobStatuses.map(status => ({
          value: status.name,
          label: status.displayName
        }))
      ]
    },
    {
      key: 'client',
      label: 'Client',
      type: 'select',
      options: [
        ...clients.map(client => ({
          value: client.name,
          label: client.name
        }))
      ]
    },
    {
      key: 'project',
      label: 'Project',
      type: 'select', 
      options: [
        ...projects.map(project => ({
          value: project.name,
          label: project.name
        }))
      ]
    },
    {
      key: 'dateFrom',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'dateTo',
      label: 'Date To', 
      type: 'date'
    }
  ];

  // Get cell styling for date columns based on status targeting
  const getDateCellStyle = (columnKey: string, row: Job) => {
    if (!row.statusInfo?.targetColumns) return {};
    
    // Map column keys to the targeting names used in the backend
    const columnMapping: Record<string, string> = {
      'nestingDate': 'nesting',
      'machiningDate': 'machining', 
      'assemblyDate': 'assembly',
      'deliveryDate': 'delivery'
    };
    
    const targetColumnName = columnMapping[columnKey];
    if (!targetColumnName) return {};
    
    const targetColumn = row.statusInfo.targetColumns.find(
      target => target.column === targetColumnName
    );
    
    if (targetColumn) {
      return {
        backgroundColor: targetColumn.color,
        fontWeight: '600',
        color: '#ffffff' // Use white text for better contrast like the original
      };
    }
    
    return {};
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const [jobsResponse, clientsResponse, projectsResponse, statusesResponse] = await Promise.all([
          apiRequest(API_ENDPOINTS.jobs, {}, token || ''),
          apiRequest(API_ENDPOINTS.clients, {}, token || ''),
          apiRequest(API_ENDPOINTS.projects, {}, token || ''),
          apiRequest(API_ENDPOINTS.jobStatuses, {}, token || '')
        ]);

        setJobs(jobsResponse.data);
        setClients(clientsResponse.data);
        setProjects(projectsResponse.data);
        setJobStatuses(statusesResponse.data);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token]);

  // Handle status click to cycle through statuses
  const handleStatusClick = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation(); // Prevent row click
    
    try {
      // Get next status logic (simplified - you might want to get this from job statuses)
      const statusOrder = ['not-assigned', 'in-progress', 'completed'];
      const currentIndex = statusOrder.indexOf(job.status);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
      
      // Update job status
      await apiRequest(`/api/jobs/${job.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...job, status: nextStatus })
      }, token || '');
      
      // Reload data to reflect changes
      const [jobsResponse] = await Promise.all([
        apiRequest(API_ENDPOINTS.jobs, {}, token || '')
      ]);
      setJobs(jobsResponse.data);
      
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update job status');
    }
  };

  // Handle row click
  const handleRowClick = (job: Job) => {
    onJobSelect(job.id);
  };

  // Apply filters to jobs data
  const filteredJobs = React.useMemo(() => {
    let filtered = jobs;

    // Text search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.unit?.toLowerCase().includes(searchTerm) ||
        job.type?.toLowerCase().includes(searchTerm) ||
        job.items?.toLowerCase().includes(searchTerm) ||
        job.clientName?.toLowerCase().includes(searchTerm) ||
        job.projectName?.toLowerCase().includes(searchTerm) ||
        job.comments?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status);
    }

    // Client filter
    if (filters.client) {
      filtered = filtered.filter(job => job.clientName === filters.client);
    }

    // Project filter
    if (filters.project) {
      filtered = filtered.filter(job => job.projectName === filters.project);
    }

    // Date range filter (using any date column)
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(job => {
        const dates = [
          job.nestingDate,
          job.machiningDate,
          job.assemblyDate,
          job.deliveryDate
        ].filter(Boolean).map(date => new Date(date!));

        if (dates.length === 0) return false;

        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        if (filters.dateFrom && minDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && maxDate > new Date(filters.dateTo)) return false;

        return true;
      });
    }

    return filtered;
  }, [jobs, filters]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <Button variant="primary">
            Add New Job
          </Button>
        </div>

        {error && (
          <ErrorDisplay 
            type="error" 
            message={error}
            onRetry={() => window.location.reload()}
            className="mb-4"
          />
        )}

        <DataTable
          data={filteredJobs}
          columns={columns}
          loading={loading}
          error={error}
          filters={filterConfigs}
          onFiltersChange={setFilters}
          defaultSort={sort}
          onSortChange={setSort}
          onRowClick={handleRowClick}
          columnPreferences={preferences}
          onColumnPreferencesChange={updatePreferences}
          resizableColumns={true}
          className="mb-8"
          emptyMessage="No jobs found"
          emptySubMessage="Try adjusting your filters or create a new job"
        />
      </div>
    </ProtectedRoute>
  );
}

export default Jobs;