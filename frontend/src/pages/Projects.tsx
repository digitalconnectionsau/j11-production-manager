import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const fetchProjects = async () => {
    if (!token) return;
    
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async () => {
    if (!projectToDelete || !token) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

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
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'client' | 'status' | 'progress' | 'jobs') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { backgroundColor: '#dcfce7', textColor: '#166534' }; // green-100/green-800
      case 'completed':
        return { backgroundColor: '#dbeafe', textColor: '#1e40af' }; // blue-100/blue-800
      case 'on-hold':
        return { backgroundColor: '#fef3c7', textColor: '#92400e' }; // yellow-100/yellow-800
      case 'cancelled':
        return { backgroundColor: '#fee2e2', textColor: '#991b1b' }; // red-100/red-800
      default:
        return { backgroundColor: '#f3f4f6', textColor: '#374151' }; // gray-100/gray-800
    }
  };

  const getPriorityColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

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
    <div>
      <PageHeader
        title="Projects"
        description="Organize and manage client projects. Track progress, assign jobs, and monitor deliverables across all active projects."
        breadcrumbs={[]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
          >
            Add Project
          </button>
        }
      />
      
      <div className="px-6">

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On-Hold">On-Hold</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Projects Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Project Name {getSortIcon('name')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('client')}
              >
                Client {getSortIcon('client')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('progress')}
              >
                Progress {getSortIcon('progress')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('jobs')}
              >
                Jobs {getSortIcon('jobs')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onProjectSelect(project.id)}
                    className="text-sm font-medium text-gray-900 hover:text-orange-600 hover:underline"
                  >
                    {project.name}
                  </button>
                  {project.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {project.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {project.client?.name || 'No client assigned'}
                  </div>
                  {project.client?.company && (
                    <div className="text-sm text-gray-500">
                      {project.client.company}
                    </div>
                  )}
                </td>
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                  style={{ 
                    backgroundColor: getStatusInfo(project.status).backgroundColor,
                    color: getStatusInfo(project.status).textColor
                  }}
                >
                  {project.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => onProjectSelect(project.id)}
                    className="hover:text-orange-600 hover:underline"
                  >
                    {project.completedJobCount}/{project.jobCount}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onProjectSelect(project.id)}
                    className="text-orange-600 hover:text-orange-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setProjectToDelete(project);
                      setShowDeleteModal(true);
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
            <p className="text-gray-500">No projects found.</p>
            {(searchTerm || statusFilter !== 'All') && (
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search or filter criteria.
              </p>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProjectAdded={fetchProjects}
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
    </div>
  );
};

export default Projects;
