import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { useTableShare } from '../hooks/useTableShare';
import { DataTable } from '../components/DataTable';
import type { TableColumn, FilterConfig, SortConfig, MultiSortConfig } from '../components/DataTable';
import { createDateRenderer } from '../components/DataTable/utils';
import { apiRequest, API_ENDPOINTS } from '../utils/api';
import Button from '../components/ui/Button';
import ErrorDisplay from '../components/ErrorDisplay';
import ProtectedRoute from '../components/ProtectedRoute';
import AddProjectModal from '../components/AddProjectModal';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  clientId?: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    name: string;
    company?: string;
  };
  jobCount: number;
  completedJobCount: number;
  progress: number;
}

interface ProjectsProps {
  onProjectSelect: (projectId: number) => void;
}

const Projects: React.FC<ProjectsProps> = ({ onProjectSelect }) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<{id: number; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    status: '',
    client: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Sorting state
  const [sort, setSort] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [multiSort, setMultiSort] = useState<MultiSortConfig[]>([]);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Column preferences
  const { preferences, updatePreferences } = useColumnPreferences('projects');

  // Helper function to describe active filters
  const getActiveFiltersDescription = () => {
    const activeFilters = [];
    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.status) activeFilters.push(`Status: ${filters.status}`);
    if (filters.client) activeFilters.push(`Client: ${filters.client}`);
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
    
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'All projects';
  };
  
  // Print and share functionality
  const { handlePrint, openShareView } = useTableShare({
    title: 'J11 Production Manager - Projects Report',
    subtitle: getActiveFiltersDescription()
  });

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [projectsResponse, clientsResponse] = await Promise.all([
        apiRequest(API_ENDPOINTS.projects, {}, token || ''),
        apiRequest(API_ENDPOINTS.clients, {}, token || '')
      ]);

      setProjects(projectsResponse.data);
      setClients(clientsResponse.data);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteProject = async () => {
    if (!projectToDelete || !token) return;

    try {
      const response = await apiRequest(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE'
      }, token);

      if (response.success) {
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        setShowDeleteModal(false);
        setProjectToDelete(null);
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  // Load data on component mount and when token changes
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [loadData, token]);  // Helper function to create clickable cell for project navigation
  const createProjectClickableCell = (value: any, row: Project, className?: string) => {
    const handleProjectClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onProjectSelect(row.id);
    };

    return (
      <button
        onClick={handleProjectClick}
        className={`text-gray-900 hover:text-gray-700 hover:underline text-left w-full ${className || ''}`}
      >
        {value || '-'}
      </button>
    );
  };

  // Define table columns
  const columns: TableColumn<Project>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: 80,
      className: 'font-mono text-sm',
      render: (value: number, row: Project) => createProjectClickableCell(value, row, 'font-mono text-sm')
    },
    {
      key: 'name',
      label: 'Project Name',
      sortable: true,
      width: 200,
      render: (value: string, row: Project) => createProjectClickableCell(value, row, 'font-medium')
    },
    {
      key: 'client',
      label: 'Client',
      sortable: true,
      width: 150,
      render: (_value: any, row: Project) => {
        const clientName = row.client?.name || '-';
        return createProjectClickableCell(clientName, row);
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
      render: (value: string, _row: Project) => {
        const getStatusColor = (status: string) => {
          switch (status.toLowerCase()) {
            case 'active':
              return 'bg-green-100 text-green-800';
            case 'completed':
              return 'bg-blue-100 text-blue-800';
            case 'on-hold':
              return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
              return 'bg-red-100 text-red-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };
        
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      width: 100,
      render: (value: number) => {
        const getProgressColor = (progress: number) => {
          if (progress >= 80) return 'bg-green-500';
          if (progress >= 50) return 'bg-yellow-500';
          if (progress >= 20) return 'bg-orange-500';
          return 'bg-red-500';
        };
        
        return (
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(value)}`}
                style={{ width: `${value}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
              {value}%
            </span>
          </div>
        );
      }
    },
    {
      key: 'jobCount',
      label: 'Jobs',
      sortable: true,
      width: 80,
      render: (value: number, row: Project) => {
        return (
          <div className="text-center">
            <span className="text-sm font-medium text-gray-900">
              {row.completedJobCount}/{value}
            </span>
          </div>
        );
      }
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
      placeholder: 'Search projects...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Completed', label: 'Completed' },
        { value: 'On-Hold', label: 'On-Hold' },
        { value: 'Cancelled', label: 'Cancelled' }
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

  // Handle row click
  const handleRowClick = (project: Project) => {
    onProjectSelect(project.id);
  };

  // Apply filters to projects data
  const filteredProjects = React.useMemo(() => {
    let filtered = projects;

    // Text search - searches across Project Name, Description, and Client columns
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.client?.name?.toLowerCase().includes(searchTerm) ||
        project.client?.company?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    // Client filter
    if (filters.client) {
      filtered = filtered.filter(project => {
        const projectClientName = (project.client?.name || '').trim();
        const filterClientName = (filters.client || '').trim();
        return projectClientName === filterClientName;
      });
    }

    // Date range filter (using created date)
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.createdAt);

        if (filters.dateFrom && projectDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && projectDate > new Date(filters.dateTo)) return false;

        return true;
      });
    }

    return filtered;
  }, [projects, filters]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-center">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageHeader
        title="Projects"
        description="Organize and manage client projects. Track progress, assign jobs, and monitor deliverables across all active projects."
        breadcrumbs={[]}
        actions={
          <div className="flex items-center space-x-3 print:hidden">
            <Button 
              variant="secondary" 
              onClick={() => {
                const visibleColumns = columns.filter(col => {
                  const pref = preferences.find(p => p.columnName === col.key);
                  return pref ? pref.isVisible : true; // Show by default if no preference
                });
                openShareView(filteredProjects, columns, visibleColumns);
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
              onClick={() => setShowAddModal(true)}
            >
              Add Project
            </Button>
          </div>
        }
      />
      
      <div className="px-6 pt-4 print:p-0">

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
          data={filteredProjects}
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
          emptyMessage="No projects found"
          emptySubMessage="Try adjusting your filters or create a new project"
        />
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProjectAdded={async () => {
          setShowAddModal(false);
          await loadData(); // Reload projects after adding a new one
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteProject}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonText="Delete"
        isDestructive={true}
      />
    </ProtectedRoute>
  );
};

export default Projects;
