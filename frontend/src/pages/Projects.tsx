import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'client' | 'status' | 'progress' | 'jobs'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch projects from API
  const fetchProjects = async () => {
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
      setFilteredProjects(projectsWithPinStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

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

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply hide completed filter
    if (hideCompleted) {
      filtered = filtered.filter(project => project.status.toLowerCase() !== 'completed');
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'client':
          aValue = a.client?.name?.toLowerCase() || '';
          bValue = b.client?.name?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'jobs':
          aValue = a.jobCount;
          bValue = b.jobCount;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProjects(filtered);
  };

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [projects, searchTerm, statusFilter, hideCompleted, sortField, sortDirection]);

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
        return 'bg-light-grey text-charcoal';
    }
  };

  const getPriorityColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-light-grey rounded w-1/4"></div>
          <div className="h-10 bg-light-grey rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-light-grey rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-black">Projects</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Project
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-light-grey p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects, clients..."
                className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Sort By</label>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field as typeof sortField);
                  setSortDirection(direction as 'asc' | 'desc');
                }}
                className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="client-asc">Client A-Z</option>
                <option value="client-desc">Client Z-A</option>
                <option value="status-asc">Status</option>
                <option value="progress-desc">Progress High-Low</option>
                <option value="progress-asc">Progress Low-High</option>
                <option value="jobs-desc">Jobs High-Low</option>
                <option value="jobs-asc">Jobs Low-High</option>
              </select>
            </div>

            {/* Hide Completed Toggle */}
            <div className="flex items-end">
              <div className="w-full">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={hideCompleted}
                      onChange={(e) => setHideCompleted(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${
                      hideCompleted ? 'bg-primary' : 'bg-light-grey'
                    }`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                      hideCompleted ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                  <span className="ml-3 text-sm text-charcoal">Hide Completed</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-charcoal">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-light-grey overflow-hidden">
        <table className="min-w-full divide-y divide-light-grey">
          <thead className="bg-light-grey">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
              >
                Project Name
                {sortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('client')}
                className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
              >
                Client
                {sortField === 'client' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('status')}
                className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('progress')}
                className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
              >
                Progress
                {sortField === 'progress' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('jobs')}
                className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
              >
                Jobs
                {sortField === 'jobs' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">
                Pin
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-grey">
            {filteredProjects.map((project) => (
              <tr 
                key={project.id} 
                className="hover:bg-light-grey cursor-pointer"
                onClick={() => onProjectSelect(project.id, 'jobs')}
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-black">{project.name}</div>
                </td>
                <td className="px-6 py-4">
                  {project.client ? (
                    <div className="text-sm text-black">{project.client.name}</div>
                  ) : (
                    <div className="text-sm text-charcoal">No client assigned</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full bg-light-grey rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${getPriorityColor(project.progress)}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-charcoal min-w-0">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-black">
                    {project.completedJobCount}/{project.jobCount}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinProject(project.id, project.isPinned || false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      project.isPinned 
                        ? 'border-orange-500 bg-orange-500' 
                        : 'border-charcoal hover:border-orange-500'
                    }`}
                    title={project.isPinned ? 'Unpin project' : 'Pin project'}
                  >
                    {project.isPinned && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button 
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium px-2 py-1 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectSelect(project.id, 'info');
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-charcoal">No projects found</div>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProjectAdded={fetchProjects}
      />
    </div>
  );
};

export default Projects;
