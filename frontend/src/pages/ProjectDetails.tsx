import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedToId?: number;
  createdAt: string;
  updatedAt: string;
}

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
    email?: string;
    phone?: string;
  };
  jobs?: Job[];
  jobCount: number;
  completedJobCount: number;
  progress: number;
  isPinned?: boolean;
}

interface ProjectDetailsProps {
  projectId: number;
  onBack: () => void;
  onJobSelect?: (jobId: number) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onBack, onJobSelect }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const { token } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch project details
  const fetchProject = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const [projectResponse, pinnedResponse] = await Promise.all([
        fetch(`${API_URL}/api/projects/${projectId}`, {
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

      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project details');
      }

      const projectData = await projectResponse.json();
      
      // Check if this project is pinned
      let isPinned = false;
      if (pinnedResponse.ok) {
        const pinnedData = await pinnedResponse.json();
        isPinned = pinnedData.some((p: any) => p.projectId === projectId);
      }

      setProject({ ...projectData, isPinned });
      setEditForm({ ...projectData, isPinned });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  // Update project
  const updateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          status: editForm.status,
          clientId: editForm.clientId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      await fetchProject(); // Refresh the data
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editForm) return;
    
    const { name, value } = e.target;
    
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  // Toggle pin status for this project
  const togglePinProject = async () => {
    if (!project) return;
    
    try {
      setIsPinning(true);
      
      if (project.isPinned) {
        // Unpin the project
        const response = await fetch(`${API_URL}/api/pinned/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setProject({ ...project, isPinned: false });
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
          setProject({ ...project, isPinned: true });
        }
      }
    } catch (err) {
      console.error('Failed to toggle pin status:', err);
    } finally {
      setIsPinning(false);
    }
  };

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

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-light-grey text-charcoal';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-light-grey text-charcoal';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  useEffect(() => {
    if (token && projectId) {
      fetchProject();
    }
  }, [projectId, token]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-light-grey rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-light-grey rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-light-grey rounded"></div>
            <div className="h-4 bg-light-grey rounded w-5/6"></div>
            <div className="h-4 bg-light-grey rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Projects
        </button>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Projects
        </button>
        <div className="text-charcoal">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Projects
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-black">{project.name}</h1>
            {project.client && (
              <p className="text-lg text-charcoal mt-1">
                {project.client.name}
                {project.client.company && ` - ${project.client.company}`}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={togglePinProject}
              disabled={isPinning}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                project.isPinned
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-light-grey hover:bg-opacity-80 text-charcoal'
              } ${isPinning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm">
                {project.isPinned ? '📌' : '📍'}
              </span>
              <span>
                {isPinning 
                  ? 'Updating...' 
                  : project.isPinned 
                    ? 'Unpin Project' 
                    : 'Pin Project'
                }
              </span>
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Edit Project
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(project);
                  }}
                  className="bg-charcoal hover:opacity-80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateProject}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="mb-6 flex items-center space-x-4">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
        <div className="flex items-center space-x-2">
          <div className="w-32 bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getProgressColor(project.progress)}`}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">{project.progress}% Complete</span>
        </div>
        <div className="text-sm text-gray-600">
          {project.completedJobCount}/{project.jobCount} Jobs Completed
        </div>
      </div>

      {/* Project Details */}
      {isEditing && editForm ? (
        <form onSubmit={updateProject} className="space-y-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={editForm.description || ''}
                onChange={handleEditChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Project Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
              <p className="text-sm text-gray-900">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
              <p className="text-sm text-gray-900">
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {project.description && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
              <p className="text-sm text-gray-900 whitespace-pre-line">{project.description}</p>
            </div>
          )}
          {project.client && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Client Information</h4>
              <div className="space-y-1">
                {project.client.email && (
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <a href={`mailto:${project.client.email}`} className="text-sm text-blue-600 hover:text-blue-800 ml-2">
                      {project.client.email}
                    </a>
                  </div>
                )}
                {project.client.phone && (
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <a href={`tel:${project.client.phone}`} className="text-sm text-blue-600 hover:text-blue-800 ml-2">
                      {project.client.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jobs/Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Jobs ({project.jobCount})</h3>
        </div>
        {project.jobs && project.jobs.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(project.jobs || []).map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onJobSelect?.(job.id)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        {job.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {job.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getJobStatusColor(job.status)}`}>
                        {job.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">No jobs assigned to this project</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
