import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { useTableShare } from '../hooks/useTableShare';
import { DataTable } from '../components/DataTable';
import type { TableColumn, FilterConfig, SortConfig, MultiSortConfig } from '../components/DataTable';

import Button from '../components/ui/Button';
import ErrorDisplay from '../components/ErrorDisplay';
import ProtectedRoute from '../components/ProtectedRoute';
import AddProjectModal from '../components/AddProjectModal';

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
  isPinned?: boolean;
}

interface ProjectsProps {
  onProjectSelect: (projectId: number, tab?: 'jobs' | 'info') => void;
}

const Projects: React.FC<ProjectsProps> = ({ onProjectSelect }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // DataTable state
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    status: '',
    hideCompleted: false
  });
  const [sort, setSort] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [multiSort, setMultiSort] = useState<MultiSortConfig[]>([]);

  // Column preferences
  const { preferences, updatePreferences } = useColumnPreferences('projects');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Helper function to get active filters description
  const getActiveFiltersDescription = () => {
    const activeFilters = [];
    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.status && filters.status !== 'All') activeFilters.push(`Status: ${filters.status}`);
    if (filters.hideCompleted) activeFilters.push('Hiding completed projects');
    
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'All projects';
  };

  // Print and share functionality
  const { handlePrint, openShareView } = useTableShare({
    title: 'J11 Production Manager - Projects Report',
    subtitle: getActiveFiltersDescription()
  });

  // Helper functions for styling
  const getStatusCellStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { backgroundColor: '#10B981', color: 'white', fontWeight: '600', textAlign: 'center' as const };
      case 'completed':
        return { backgroundColor: '#3B82F6', color: 'white', fontWeight: '600', textAlign: 'center' as const };
      case 'on-hold':
        return { backgroundColor: '#F59E0B', color: 'white', fontWeight: '600', textAlign: 'center' as const };
      case 'cancelled':
        return { backgroundColor: '#EF4444', color: 'white', fontWeight: '600', textAlign: 'center' as const };
      default:
        return { backgroundColor: '#6B7280', color: 'white', fontWeight: '600', textAlign: 'center' as const };
    }
  };

  const getPriorityColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Custom renderers for table cells
  const createProjectClickableCell = (value: any, row: Project, className?: string) => {
    const handleProjectClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onProjectSelect(row.id, 'jobs');
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

  // Column definitions for DataTable
  const columns: TableColumn[] = [
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
        const clientName = row.client?.name || 'No client assigned';
        return createProjectClickableCell(clientName, row, row.client ? '' : 'text-gray-500');
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
      render: (value: string, _row: Project) => (
        <span style={{ fontWeight: '600' }}>
          {value}
        </span>
      ),
      cellStyle: (row: Project) => getStatusCellStyle(row.status)
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      width: 120,
      render: (value: number, _row: Project) => (
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
            <div
              className={`h-2 rounded-full ${getPriorityColor(value)}`}
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600 min-w-0">{value}%</span>
        </div>
      )
    },
    {
      key: 'jobCount',
      label: 'Jobs',
      sortable: true,
      width: 100,
      render: (value: number, row: Project) => createProjectClickableCell(`${row.completedJobCount}/${value}`, row)
    },
    {
      key: 'isPinned',
      label: 'Pin',
      sortable: false,
      width: 60,
      render: (value: boolean, row: Project) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePinProject(row.id, value || false);
          }}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            value 
              ? 'border-orange-500 bg-orange-500' 
              : 'border-gray-400 hover:border-orange-500'
          }`}
          title={value ? 'Unpin project' : 'Pin project'}
        >
          {value && (
            <div className="w-2 h-2 bg-white rounded-full"></div>
          )}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: 80,
      render: (_value: any, row: Project) => (
        <button 
          className="text-orange-600 hover:text-orange-800 hover:underline font-medium px-2 py-1 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onProjectSelect(row.id, 'info');
          }}
        >
          Edit
        </button>
      )
    }
  ];

  // Define filters for DataTable
  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search projects, clients...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'All', label: 'All Statuses' },
        { value: 'Active', label: 'Active' },
        { value: 'Completed', label: 'Completed' },
        { value: 'On-Hold', label: 'On-Hold' },
        { value: 'Cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'hideCompleted',
      label: 'Hide Completed',
      type: 'toggle'
    }
  ];

  // Load data function using callback pattern like Jobs
  const loadData = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const [projectsResponse, pinnedResponse] = await Promise.all([
        fetch(`${API_URL}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_URL}/api/pinned`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }

      const projectsData = await projectsResponse.json();
      
      // Get pinned project IDs
      let pinnedProjectIds: number[] = [];
      if (pinnedResponse.ok) {
        const pinnedData = await pinnedResponse.json();
        pinnedProjectIds = pinnedData.map((p: any) => p.projectId);
      }

      // Add isPinned property to each project
      const projectsWithPinStatus = projectsData.map((project: Project) => ({
        ...project,
        isPinned: pinnedProjectIds.includes(project.id)
      }));

      setProjects(projectsWithPinStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

      // Pin/Unpin a project (only updates project state for table display)
  const togglePinProject = async (projectId: number, isPinned: boolean) => {
    try {
      if (isPinned) {
        // Unpin the project
        const response = await fetch(`${API_URL}/api/pinned/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, isPinned: false } : p
          ));
        }
      } else {
        // Pin the project
        const response = await fetch(`${API_URL}/api/pinned`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId }),
        });

        if (response.ok) {
          setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, isPinned: true } : p
          ));
        }
      }
    } catch (err) {
      console.error('Failed to toggle pin status:', err);
    }
  };

  // Load data on component mount and when token changes
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [loadData, token]);

  return (
    <ProtectedRoute>
      <div className="p-6 print:p-0">
        <div className="flex justify-between items-center mb-6 print:mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 print:text-xl print:mb-1">Projects</h1>
            <div className="hidden print:block text-sm text-gray-600 mt-1">
              {getActiveFiltersDescription()} • Generated: {new Date().toLocaleString()}
            </div>
          </div>
          <div className="flex items-center space-x-3 print:hidden">
            <Button 
              variant="secondary" 
              onClick={() => {
                const visibleColumns = columns.filter(col => {
                  const pref = preferences.find(p => p.columnName === col.key);
                  return pref ? pref.isVisible : true;
                });
                openShareView(projects, columns, visibleColumns);
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
              {multiSort.map((sortItem) => (
                <span key={sortItem.field} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                  {sortItem.priority}. {columns.find(col => col.key === sortItem.field)?.label} {sortItem.direction === 'asc' ? '↑' : '↓'}
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
          data={projects}
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
          onRowClick={(project: Project) => onProjectSelect(project.id, 'jobs')}
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
        onProjectAdded={loadData}
      />
    </ProtectedRoute>
  );
};

export default Projects;
