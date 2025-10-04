import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { DataTable } from '../components/DataTable';
import type { TableColumn, FilterConfig, SortConfig, MultiSortConfig } from '../components/DataTable';
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

interface WeekSeparator {
  isWeekSeparator: true;
  weekInfo: string;
}

type JobOrSeparator = Job | WeekSeparator;

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
  targetColumns?: ColumnTarget[];
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
    dateTo: '',
    showWeekSeparators: false,
    hideCompleted: false
  });
  
  // Sorting state
  const [sort, setSort] = useState<SortConfig>({ field: 'id', direction: 'desc' });
  const [multiSort, setMultiSort] = useState<MultiSortConfig[]>([]);
  
  // Display settings from localStorage
  const [displaySettings] = useState(() => {
    const saved = localStorage.getItem('displaySettings');
    return saved ? JSON.parse(saved) : {
      weekType: 'calendar',
      weekStartDay: 'monday',
      weekCalculationBase: 'delivery'
    };
  });
  
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
      width: 80
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: 80
    },
    {
      key: 'items',
      label: 'Items',
      sortable: true,
      width: 120
    },
    {
      key: 'clientName',
      label: 'Client',
      sortable: true,
      width: 100
    },
    {
      key: 'projectName',
      label: 'Project',
      sortable: true,
      width: 120,
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
      width: 100,
      render: (value: string, row: Job) => {
        if (row.statusInfo) {
          // Ensure colors have # prefix
          const backgroundColor = row.statusInfo.backgroundColor?.startsWith('#') 
            ? row.statusInfo.backgroundColor 
            : `#${row.statusInfo.backgroundColor}`;
          const textColor = row.statusInfo.color?.startsWith('#') 
            ? row.statusInfo.color 
            : `#${row.statusInfo.color}`;
            
          return (
            <span
              onClick={(e) => handleStatusClick(e, row)}
              style={{
                backgroundColor: backgroundColor,
                color: textColor,
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
      label: 'Nesting',
      sortable: true,
      width: 100,
      render: createDateRenderer(),
      cellStyle: (row: Job) => getDateCellStyle('nestingDate', row)
    },
    {
      key: 'machiningDate',
      label: 'Machining',
      sortable: true,
      width: 100,
      render: createDateRenderer(),
      cellStyle: (row: Job) => getDateCellStyle('machiningDate', row)
    },
    {
      key: 'assemblyDate',
      label: 'Assembly',
      sortable: true,
      width: 100,
      render: createDateRenderer(),
      cellStyle: (row: Job) => getDateCellStyle('assemblyDate', row)
    },
    {
      key: 'deliveryDate',
      label: 'Delivery',
      sortable: true,
      width: 100,
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
    },
    {
      key: 'showWeekSeparators',
      label: 'Week Separators',
      type: 'toggle',
      placeholder: 'Show week breaks in table'
    },
    {
      key: 'hideCompleted',
      label: 'Hide Delivered',
      type: 'toggle',
      placeholder: 'Hide delivered jobs'
    }
  ];

  // Get cell styling for date columns based on status targeting
  const getDateCellStyle = (columnKey: string, row: Job) => {
    if (!row.statusInfo?.targetColumns || !Array.isArray(row.statusInfo.targetColumns)) return {};
    
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
      target => target && target.column && target.column.toLowerCase() === targetColumnName.toLowerCase()
    );
    
    if (targetColumn && targetColumn.color) {
      // Ensure color has # prefix
      const color = targetColumn.color.startsWith('#') ? targetColumn.color : `#${targetColumn.color}`;
      return {
        backgroundColor: color,
        fontWeight: '600',
        color: '#ffffff' // Use white text for better contrast
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

        // Debug specific job date fields for comparison
        if (jobsResponse.data && jobsResponse.data.length > 0) {
          const firstJob = jobsResponse.data[0];
          console.log('Jobs page - First job date fields:', {
            nestingDate: firstJob.nestingDate,
            machiningDate: firstJob.machiningDate,
            assemblyDate: firstJob.assemblyDate,
            deliveryDate: firstJob.deliveryDate,
            nestingDateType: typeof firstJob.nestingDate,
            machiningDateType: typeof firstJob.machiningDate
          });
        }

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
      // Cycle through available job statuses
      const currentIndex = jobStatuses.findIndex(status => status.id === job.statusId);
      const nextIndex = (currentIndex + 1) % jobStatuses.length;
      const nextStatus = jobStatuses[nextIndex];
      
      // Update job status on the server
      const response = await apiRequest(`/api/jobs/${job.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          ...job, 
          status: nextStatus.name,
          statusId: nextStatus.id
        })
      }, token || '');

      if (response.success) {
        // Update local state without full reload
        setJobs(prevJobs => 
          prevJobs.map(j => 
            j.id === job.id 
              ? { 
                  ...j, 
                  status: nextStatus.name,
                  statusId: nextStatus.id,
                  statusInfo: {
                    id: nextStatus.id,
                    name: nextStatus.name,
                    displayName: nextStatus.displayName,
                    color: nextStatus.color,
                    backgroundColor: nextStatus.backgroundColor,
                    isDefault: nextStatus.isDefault,
                    isFinal: nextStatus.isFinal,
                    targetColumns: nextStatus.targetColumns || []
                  }
                }
              : j
          )
        );
      } else {
        throw new Error(response.error || 'Failed to update status');
      }
      
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

    // Text search - searches across ID, Unit, Type, Items, Comments, Client, and Project columns
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.id?.toString().toLowerCase().includes(searchTerm) ||
        job.unit?.toLowerCase().includes(searchTerm) ||
        job.type?.toLowerCase().includes(searchTerm) ||
        job.items?.toLowerCase().includes(searchTerm) ||
        job.comments?.toLowerCase().includes(searchTerm) ||
        job.clientName?.toLowerCase().includes(searchTerm) ||
        job.projectName?.toLowerCase().includes(searchTerm)
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
      console.log('Date filtering active:', { dateFrom: filters.dateFrom, dateTo: filters.dateTo });
      console.log('Jobs before date filter:', filtered.length);
      
      filtered = filtered.filter(job => {
        const dates = [
          job.nestingDate,
          job.machiningDate,
          job.assemblyDate,
          job.deliveryDate
        ].filter(Boolean).map(date => new Date(date!));

        if (dates.length === 0) {
          console.log('Job', job.id, 'has no dates, excluding');
          return false;
        }

        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        console.log('Job', job.id, 'dates:', { minDate, maxDate, dateFrom: filters.dateFrom, dateTo: filters.dateTo });

        if (filters.dateFrom && minDate < new Date(filters.dateFrom)) {
          console.log('Job', job.id, 'excluded: minDate', minDate, 'before dateFrom', new Date(filters.dateFrom));
          return false;
        }
        if (filters.dateTo && maxDate > new Date(filters.dateTo)) {
          console.log('Job', job.id, 'excluded: maxDate', maxDate, 'after dateTo', new Date(filters.dateTo));
          return false;
        }

        console.log('Job', job.id, 'included in date filter');
        return true;
      });
      
      console.log('Jobs after date filter:', filtered.length);
    }

    // Hide completed filter - only hide "delivered" jobs
    if (filters.hideCompleted) {
      filtered = filtered.filter(job => {
        const isDelivered = 
          job.status?.toLowerCase() === 'delivered' ||
          job.statusInfo?.name?.toLowerCase() === 'delivered' ||
          job.statusInfo?.displayName?.toLowerCase() === 'delivered';
        
        return !isDelivered;
      });
    }

    // Add week separators if enabled
    if (filters.showWeekSeparators && (filters.dateFrom || filters.dateTo)) {
      const jobsWithSeparators: (Job | { isWeekSeparator: true; weekInfo: string })[] = [];
      
      // Helper function to get the date to use for calculations based on settings
      const getCalculationDate = (job: Job) => {
        let dateToUse: string | null = null;
        
        // Use the date column specified in display settings
        switch (displaySettings.weekCalculationBase) {
          case 'nesting':
            dateToUse = job.nestingDate;
            break;
          case 'machining':
            dateToUse = job.machiningDate;
            break;
          case 'assembly':
            dateToUse = job.assemblyDate;
            break;
          case 'delivery':
          default:
            dateToUse = job.deliveryDate;
            break;
        }
        
        return dateToUse ? new Date(dateToUse) : null;
      };

      // Helper function to get week start date based on settings
      const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const diff = displaySettings.weekStartDay === 'monday' 
          ? (day === 0 ? -6 : 1 - day)  // Monday start
          : -day;                        // Sunday start
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
      };

      // Helper function to get week identifier
      const getWeekIdentifier = (date: Date) => {
        if (displaySettings.weekType === 'workWeek') {
          // Work week: Monday-Friday
          const weekStart = getWeekStart(date);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 4); // Friday
          return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
        } else {
          // Calendar week: full 7 days
          const weekStart = getWeekStart(date);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
        }
      };

      // Sort jobs by their calculation date for proper week grouping
      const sortedJobs = [...filtered].sort((a, b) => {
        const dateA = getCalculationDate(a);
        const dateB = getCalculationDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      });

      let currentWeekIdentifier = '';

      sortedJobs.forEach((job) => {
        const calculationDate = getCalculationDate(job);
        
        if (!calculationDate) {
          jobsWithSeparators.push(job);
          return;
        }
        
        const weekIdentifier = getWeekIdentifier(calculationDate);
        
        // If this is a new week, add a separator
        if (currentWeekIdentifier !== weekIdentifier) {
          if (currentWeekIdentifier !== '') {
            // Add separator between weeks
            jobsWithSeparators.push({
              isWeekSeparator: true,
              weekInfo: `Week of ${weekIdentifier}`
            });
          }
          currentWeekIdentifier = weekIdentifier;
        }
        
        jobsWithSeparators.push(job);
      });

      return jobsWithSeparators;
    }

    return filtered;
  }, [jobs, filters]);

  return (
    <ProtectedRoute>
      <div className="p-6">
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

        {multiSort.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 flex items-center space-x-2">
              <span>Multi-sort active:</span>
              {multiSort.map((sort) => (
                <span key={sort.field} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                  {sort.priority}. {columns.find(col => col.key === sort.field)?.label} {sort.direction === 'asc' ? '↑' : '↓'}
                </span>
              ))}
            </div>
            <button 
              onClick={() => setMultiSort([])}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all sorts
            </button>
          </div>
        )}
        
        <div className="mb-2">
          <div className="text-xs text-gray-500">
            💡 Tip: Click column headers to sort. Hold Ctrl/Cmd + click to add multiple sorts.
          </div>
        </div>

        <DataTable
          data={filteredJobs as any}
          columns={columns}
          loading={loading}
          error={error}
          filters={filterConfigs}
          currentFilters={filters}
          onFiltersChange={setFilters}
          defaultSort={sort}
          onSortChange={setSort}
          multiSort={multiSort}
          onMultiSortChange={setMultiSort}
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