import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'client' | 'status' | 'progress' | 'jobs'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
      setFilteredProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
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

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSortField('name');
    setSortDirection('asc');
  };

  // Delete project
  const deleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchProjects();
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [projects, searchTerm, statusFilter, sortField, sortDirection]);

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
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Project
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects, clients..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field as typeof sortField);
                  setSortDirection(direction as 'asc' | 'desc');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Project Name
                {sortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('client')}
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Client
                {sortField === 'client' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('status')}
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('progress')}
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Progress
                {sortField === 'progress' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('jobs')}
                className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Jobs
                {sortField === 'jobs' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <tr 
                key={project.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onProjectSelect(project.id)}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {project.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {project.client ? (
                    <div>
                      <div className="text-sm text-gray-900">{project.client.name}</div>
                      {project.client.company && (
                        <div className="text-sm text-gray-500">{project.client.company}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No client assigned</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${getPriorityColor(project.progress)}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 min-w-0">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {project.completedJobCount}/{project.jobCount}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit functionality - to be implemented
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No projects found</div>
          </div>
        )}
      </div>

      {/* Add Project Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Project</h2>
            <p className="text-gray-600 mb-4">Project creation form coming soon...</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
