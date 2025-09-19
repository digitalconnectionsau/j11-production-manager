import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { DataTable } from '../components/DataTable';
import type { TableColumn, FilterConfig, SortConfig } from '../components/DataTable';
import { createStatusRenderer, createDateRenderer } from '../components/DataTable/utils';
import Button from '../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

function Jobs() {
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
      width: 180
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
              style={{
                backgroundColor: row.statusInfo.backgroundColor,
                color: row.statusInfo.color,
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'center',
                display: 'inline-block',
                minWidth: '80px'
              }}
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
    
    const targetColumn = row.statusInfo.targetColumns.find(
      target => target.column === columnKey
    );
    
    if (targetColumn) {
      return {
        backgroundColor: targetColumn.color,
        fontWeight: '600',
        color: '#1f2937'
      };
    }
    
    return {};
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const [jobsRes, clientsRes, projectsRes, statusesRes] = await Promise.all([
          fetch(`${API_URL}/api/jobs`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/clients`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/job-statuses`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!jobsRes.ok || !clientsRes.ok || !projectsRes.ok || !statusesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [jobsData, clientsData, projectsData, statusesData] = await Promise.all([
          jobsRes.json(),
          clientsRes.json(),
          projectsRes.json(),
          statusesRes.json()
        ]);

        setJobs(jobsData);
        setClients(clientsData);
        setProjects(projectsData);
        setJobStatuses(statusesData);
        
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

  // Handle row click
  const handleRowClick = (job: Job) => {
    // Navigate to job details or open modal
    console.log('Job clicked:', job);
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
        <Button variant="primary">
          Add New Job
        </Button>
      </div>

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
  );
}

export default Jobs;