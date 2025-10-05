import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { useTableShare } from '../hooks/useTableShare';
import { DataTable } from '../components/DataTable';
import type { TableColumn, FilterConfig, SortConfig, MultiSortConfig } from '../components/DataTable';
import { createStatusRenderer, createDateRenderer } from '../components/DataTable/utils';
import { apiRequest, API_ENDPOINTS } from '../utils/api';
import Button from '../components/ui/Button';
import ErrorDisplay from '../components/ErrorDisplay';
import ProtectedRoute from '../components/ProtectedRoute';
import AddJobModal from '../components/AddJobModal';
import PageHeader from '../components/PageHeader';

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
  onClientSelect?: (clientId: number) => void;
}

function Jobs({ onProjectSelect, onJobSelect, onClientSelect }: JobsProps) {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  
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
  
  // Display settings from localStorage (reactive)
  const [displaySettings, setDisplaySettings] = useState(() => {
    const saved = localStorage.getItem('displaySettings');
    return saved ? JSON.parse(saved) : {
      weekType: 'calendar',
      weekStartDay: 'monday',
      weekCalculationBase: 'delivery'
    };
  });

  // Listen for changes to localStorage displaySettings
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('displaySettings');
      if (saved) {
        setDisplaySettings(JSON.parse(saved));
      }
    };

    // Listen for storage events (changes from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes made in the same tab
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  // Column preferences
  const { preferences, updatePreferences } = useColumnPreferences('jobs');

  // Helper function to describe active filters
  const getActiveFiltersDescription = () => {
    const activeFilters = [];
    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.status) {
      const status = jobStatuses.find(s => s.id.toString() === filters.status);
      if (status) activeFilters.push(`Status: ${status.displayName}`);
    }
    if (filters.client) {
      const client = clients.find(c => c.id.toString() === filters.client);
      if (client) activeFilters.push(`Client: ${client.name}`);
    }
    if (filters.project) {
      const project = projects.find(p => p.id.toString() === filters.project);
      if (project) activeFilters.push(`Project: ${project.name}`);
    }
    if (filters.dateFrom || filters.dateTo) {
      let dateRange = 'Date: ';
      if (filters.dateFrom && filters.dateTo) {
        dateRange += `${filters.dateFrom} to ${filters.dateTo}`;
      } else if (filters.dateFrom) {
        dateRange += `from ${filters.dateFrom}`;
      } else {
        dateRange += `until ${filters.dateTo}`;
      }
      activeFilters.push(dateRange);
    }
    if (filters.hideCompleted) activeFilters.push('Hiding completed jobs');
    if (filters.showWeekSeparators) activeFilters.push('Showing week separators');
    
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'All jobs';
  };
  
  // Print and share functionality
  const { handlePrint, openShareView } = useTableShare({
    title: 'J11 Production Manager - Jobs Report',
    subtitle: getActiveFiltersDescription()
  });

  // Helper function to create clickable cell for job navigation
  const createJobClickableCell = (value: any, row: Job, className?: string) => {
    const handleJobClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Set both job ID and project ID for navigation
      onJobSelect(row.id);
      onProjectSelect(row.projectId);
    };

    return (
      <button
        onClick={handleJobClick}
        className={`text-gray-900 hover:text-gray-700 hover:underline text-left w-full ${className || ''}`}
      >
        {value || '-'}
      </button>
    );
  };

  // Define table columns
  const columns: TableColumn<Job>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: 80,
      className: 'font-mono text-sm',
      render: (value: number, row: Job) => createJobClickableCell(value, row, 'font-mono text-sm')
    },
    {
      key: 'unit',
      label: 'Unit',
      sortable: true,
      width: 80,
      render: (value: string, row: Job) => createJobClickableCell(value, row)
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: 80,
      render: (value: string, row: Job) => createJobClickableCell(value, row)
    },
    {
      key: 'items',
      label: 'Items',
      sortable: true,
      width: 120,
      render: (value: string, row: Job) => createJobClickableCell(value, row)
    },
    {
      key: 'clientName',
      label: 'Client',
      sortable: true,
      width: 100,
      render: (value: string) => {
        if (!onClientSelect) {
          return value;
        }
        
        // Find the client ID from the client name
        const client = clients.find(c => c.name === value);
        if (!client) {
          return value;
        }
        
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClientSelect(client.id);
            }}
            className="text-gray-900 hover:text-gray-700 hover:underline text-left"
          >
            {value}
          </button>
        );
      }
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
          className="text-gray-900 hover:text-gray-700 hover:underline text-left"
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
          return (
            <span
              onClick={(e) => handleStatusClick(e, row)}
              style={{
                cursor: 'pointer',
                fontWeight: '600'
              }}
              title="Click to change status"
            >
              {row.statusInfo.displayName}
            </span>
          );
        }
        return createStatusRenderer()(value);
      },
      cellStyle: (row: Job) => getStatusCellStyle(row)
    },
    {
      key: 'nestingDate',
      label: 'Nesting',
      sortable: true,
      width: 100,
      render: (value: string, row: Job) => {
        // Use the original createDateRenderer logic but make it clickable
        const originalDate = createDateRenderer()(value);
        
        const dateStyle = getDateCellStyle('nestingDate', row);
        const isHighlighted = Object.keys(dateStyle).length > 0;
        
        const handleJobClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onJobSelect(row.id);
          onProjectSelect(row.projectId);
        };

        return (
          <button
            onClick={handleJobClick}
            className={`hover:underline text-left w-full ${
              isHighlighted ? '' : 'text-gray-900 hover:text-gray-700'
            }`}
            style={isHighlighted ? { ...dateStyle, color: dateStyle.color || '#ffffff' } : {}}
          >
            {originalDate}
          </button>
        );
      },
      cellStyle: (row: Job) => getDateCellStyle('nestingDate', row)
    },
    {
      key: 'machiningDate',
      label: 'Machining',
      sortable: true,
      width: 100,
      render: (value: string, row: Job) => {
        // Use the original createDateRenderer logic but make it clickable
        const originalDate = createDateRenderer()(value);
        
        const dateStyle = getDateCellStyle('machiningDate', row);
        const isHighlighted = Object.keys(dateStyle).length > 0;
        
        const handleJobClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onJobSelect(row.id);
          onProjectSelect(row.projectId);
        };

        return (
          <button
            onClick={handleJobClick}
            className={`hover:underline text-left w-full ${
              isHighlighted ? '' : 'text-gray-900 hover:text-gray-700'
            }`}
            style={isHighlighted ? { ...dateStyle, color: dateStyle.color || '#ffffff' } : {}}
          >
            {originalDate}
          </button>
        );
      },
      cellStyle: (row: Job) => getDateCellStyle('machiningDate', row)
    },
    {
      key: 'assemblyDate',
      label: 'Assembly',
      sortable: true,
      width: 100,
      render: (value: string, row: Job) => {
        // Use the original createDateRenderer logic but make it clickable
        const originalDate = createDateRenderer()(value);
        
        const dateStyle = getDateCellStyle('assemblyDate', row);
        const isHighlighted = Object.keys(dateStyle).length > 0;
        
        const handleJobClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onJobSelect(row.id);
          onProjectSelect(row.projectId);
        };

        return (
          <button
            onClick={handleJobClick}
            className={`hover:underline text-left w-full ${
              isHighlighted ? '' : 'text-gray-900 hover:text-gray-700'
            }`}
            style={isHighlighted ? { ...dateStyle, color: dateStyle.color || '#ffffff' } : {}}
          >
            {originalDate}
          </button>
        );
      },
      cellStyle: (row: Job) => getDateCellStyle('assemblyDate', row)
    },
    {
      key: 'deliveryDate',
      label: 'Delivery',
      sortable: true,
      width: 100,
      render: (value: string, row: Job) => {
        // Use the original createDateRenderer logic but make it clickable
        const originalDate = createDateRenderer()(value);
        
        const dateStyle = getDateCellStyle('deliveryDate', row);
        const isHighlighted = Object.keys(dateStyle).length > 0;
        
        const handleJobClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onJobSelect(row.id);
          onProjectSelect(row.projectId);
        };

        return (
          <button
            onClick={handleJobClick}
            className={`hover:underline text-left w-full ${
              isHighlighted ? '' : 'text-gray-900 hover:text-gray-700'
            }`}
            style={isHighlighted ? { ...dateStyle, color: dateStyle.color || '#ffffff' } : {}}
          >
            {originalDate}
          </button>
        );
      },
      cellStyle: (row: Job) => getDateCellStyle('deliveryDate', row)
    },
    {
      key: 'comments',
      label: 'Comments',
      sortable: true,
      width: 200,
      render: (value: string, row: Job) => createJobClickableCell(value, row)
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

  // Get cell styling for status column
  const getStatusCellStyle = (row: Job) => {
    if (row.statusInfo && row.statusInfo.backgroundColor) {
      // Ensure color has # prefix
      const backgroundColor = row.statusInfo.backgroundColor.startsWith('#') 
        ? row.statusInfo.backgroundColor 
        : `#${row.statusInfo.backgroundColor}`;
      const textColor = row.statusInfo.color?.startsWith('#') 
        ? row.statusInfo.color 
        : `#${row.statusInfo.color}`;
      
      return {
        backgroundColor: backgroundColor,
        color: textColor || '#ffffff',
        fontWeight: '600',
        textAlign: 'center' as const
      };
    }
    
    return {};
  };

  // Load data function
  const loadData = useCallback(async () => {
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
    }, [token]);

  // Load data on component mount and when token changes
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [loadData, token]);

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
    onProjectSelect(job.projectId);
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
      filtered = filtered.filter(job => {
        // Handle null/undefined clientName cases and trim whitespace
        const jobClientName = (job.clientName || '').trim();
        const filterClientName = (filters.client || '').trim();
        return jobClientName === filterClientName;
      });
    }

    // Project filter
    if (filters.project) {
      filtered = filtered.filter(job => {
        // Handle null/undefined projectName cases and trim whitespace
        const jobProjectName = (job.projectName || '').trim();
        const filterProjectName = (filters.project || '').trim();
        return jobProjectName === filterProjectName;
      });
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
    if (filters.showWeekSeparators) {
      const jobsWithSeparators: (Job | WeekSeparator)[] = [];
      
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
        
        // Parse DD/MM/YYYY format correctly
        if (!dateToUse) return null;
        
        const parts = dateToUse.split('/');
        if (parts.length === 3) {
          // Convert DD/MM/YYYY to MM/DD/YYYY for JavaScript Date constructor
          const [day, month, year] = parts;
          return new Date(`${month}/${day}/${year}`);
        }
        
        return new Date(dateToUse);
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
          // Add separator before the jobs of the new week
          jobsWithSeparators.push({
            isWeekSeparator: true,
            weekInfo: `Week of ${weekIdentifier}`
          });
          currentWeekIdentifier = weekIdentifier;
        }
        
        jobsWithSeparators.push(job);
      });

      return jobsWithSeparators;
    }

    return filtered;
  }, [jobs, filters, displaySettings]);

  return (
    <ProtectedRoute>
      <PageHeader
        title="Jobs"
        description="Manage and track all production jobs across different projects. Monitor progress, update statuses, and coordinate delivery schedules."
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => {} },
          { label: 'Jobs' }
        ]}
        actions={
          <div className="flex items-center space-x-3 print:hidden">
            <Button 
              variant="secondary" 
              onClick={() => {
                const visibleColumns = columns.filter(col => {
                  const pref = preferences.find(p => p.columnName === col.key);
                  return pref ? pref.isVisible : true; // Show by default if no preference
                });
                openShareView(filteredJobs, columns, visibleColumns);
              }}
            >
              📤 Share
            </Button>
            <Button 
              variant="secondary" 
              onClick={handlePrint}
            >
              🖨️ Print
            </Button>
            <Button 
              variant="primary"
              onClick={() => setShowAddJobModal(true)}
            >
              Add New Job
            </Button>
          </div>
        }
      />
      
      <div className="px-6 print:p-0">
        <div className="hidden print:block text-sm text-gray-600 mb-4">
          {getActiveFiltersDescription()} • Generated: {new Date().toLocaleString()}
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
          <div className="mb-2 flex items-center justify-between print:hidden">
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
        
        <div className="mb-2 print:hidden">
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

      {/* Add Job Modal */}
      <AddJobModal 
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
        onJobAdded={() => {
          setShowAddJobModal(false);
          loadData(); // Reload jobs after adding a new one
        }}
        projects={projects}
      />
    </ProtectedRoute>
  );
}

export default Jobs;