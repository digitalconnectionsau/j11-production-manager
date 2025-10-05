import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { formatDate as formatDateUtil } from '../utils/dateUtils';
import { apiRequest } from '../utils/api';
import AddJobModal from '../components/AddJobModal';
import BulkUploadModal from '../components/BulkUploadModal';
import PageHeader from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import type { TableColumn } from '../components/DataTable';
import Button from '../components/ui/Button';

interface ColumnTarget {
  column: string;
  color: string;
}

interface Job {
  id: number;
  projectId: number;
  unit?: string;
  type?: string;
  items: string;
  nestingDate?: string | null;
  machiningDate?: string | null;
  assemblyDate?: string | null;
  deliveryDate?: string | null;
  status: 'not-assigned' | 'nesting-complete' | 'machining-complete' | 'assembly-complete' | 'delivered';
  statusId?: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  statusInfo?: {
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

interface JobStatus {
  id: number;
  name: string;
  displayName: string;
  color: string;
  backgroundColor: string;
  orderIndex: number;
  isDefault: boolean;
  isFinal: boolean;
  targetColumns?: ColumnTarget[];
}

interface ColumnTarget {
  column: string;
  color: string;
}

interface ProjectDetailsProps {
  projectId: number;
  onBack: () => void;
  onJobSelect?: (jobId: number) => void;
  initialTab?: 'jobs' | 'info';
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onBack, onJobSelect, initialTab = 'jobs' }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'info'>(initialTab);
  
  // Column preferences for project jobs table
  const { preferences, updatePreferences } = useColumnPreferences('project-jobs');
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
  const { token } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Helper function to format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '-';
    }
    try {
      const result = formatDateUtil(dateString);
      return result || '-';
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', dateString);
      return '-';
    }
  };

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

  // Fetch job statuses for status cycling
  useEffect(() => {
    if (token) {
      fetchJobStatuses();
    }
  }, [token]);

  const fetchJobStatuses = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/job-statuses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const statuses = await response.json();
        setJobStatuses(statuses.sort((a: JobStatus, b: JobStatus) => a.orderIndex - b.orderIndex));
      }
    } catch (err) {
      console.error('Failed to fetch job statuses:', err);
    }
  };

  const cycleJobStatus = async (jobId: number, currentStatus: string) => {
    if (jobStatuses.length === 0) return;
    
    // Find current status index
    const currentIndex = jobStatuses.findIndex(status => status.name === currentStatus);
    
    // Get next status (cycle back to first if at end)
    const nextIndex = (currentIndex + 1) % jobStatuses.length;
    const nextStatus = jobStatuses[nextIndex];
    
    try {
      const response = await apiRequest(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus.name,
          statusId: nextStatus.id,
        }),
      });

      if (response.success) {
        // Update the job in the local state instead of refetching entire project
        setProject(prevProject => {
          if (!prevProject || !prevProject.jobs) return prevProject;
          
          return {
            ...prevProject,
            jobs: prevProject.jobs.map(job => 
              job.id === jobId 
                ? { 
                    ...job, 
                    statusId: nextStatus.id, 
                    status: nextStatus.name as any,
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
                : job
            )
          };
        });
      } else {
        throw new Error('Failed to update job status');
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
      setError('Failed to update job status');
    }
  };

  const getJobStatusStyle = (job: Job) => {
    if (!job.statusInfo) {
      return { color: '#000', backgroundColor: '#f3f4f6' };
    }
    return {
      color: job.statusInfo.color,
      backgroundColor: job.statusInfo.backgroundColor,
    };
  };

  const getColumnStyle = (job: Job, columnName: string) => {
    if (!job.statusInfo?.targetColumns) {
      return {};
    }
    
    // Find the specific column targeting rule
    const targetRule = job.statusInfo.targetColumns.find(target => target.column === columnName);
    if (!targetRule) {
      return {};
    }
    
    return {
      backgroundColor: targetRule.color,
      color: '#ffffff', // Use white text for better contrast
    };
  };

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

  // DataTable column configuration for jobs
  const columns: TableColumn[] = [
    {
      key: 'id',
      label: 'Job #',
      sortable: true,
      render: (value: any) => `#${value}`
    },
    {
      key: 'unit',
      label: 'Unit',
      sortable: true,
      render: (value: any) => value || '-'
    },
    {
      key: 'type', 
      label: 'Type',
      sortable: true,
      render: (value: any) => value || '-'
    },
    {
      key: 'items',
      label: 'Items', 
      sortable: true,
      render: (value: any) => value || '-'
    },
    {
      key: 'nestingDate',
      label: 'Nesting',
      sortable: true,
      render: (value: string | null, row: any) => {
        const formattedDate = formatDate(value);
        const style = getColumnStyle(row, 'nesting');
        return (
          <div style={style} className="text-sm">
            {formattedDate}
          </div>
        );
      }
    },
    {
      key: 'machiningDate', 
      label: 'Machining',
      sortable: true,
      render: (value: string | null, row: any) => {
        const formattedDate = formatDate(value);
        const style = getColumnStyle(row, 'machining');
        return (
          <div style={style} className="text-sm">
            {formattedDate}
          </div>
        );
      }
    },
    {
      key: 'assemblyDate',
      label: 'Assembly', 
      sortable: true,
      render: (value: string | null, row: any) => {
        const formattedDate = formatDate(value);
        const style = getColumnStyle(row, 'assembly');
        return (
          <div style={style} className="text-sm">
            {formattedDate}
          </div>
        );
      }
    },
    {
      key: 'deliveryDate',
      label: 'Delivery',
      sortable: true, 
      render: (value: string | null, row: any) => {
        const formattedDate = formatDate(value);
        const style = getColumnStyle(row, 'delivery');
        return (
          <div style={style} className="text-sm">
            {formattedDate}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value: any, row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            cycleJobStatus(row.id, row.status);
          }}
          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity"
          style={getJobStatusStyle(row)}
        >
          {row.statusInfo?.displayName || row.status.replace('-', ' ')}
        </button>
      )
    },
    {
      key: 'comments',
      label: 'Comments',
      sortable: false,
      render: (value: any) => (
        <div className="text-sm text-gray-500 max-w-xs truncate">
          {value || '-'}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description || `Manage jobs and details for ${project.name}${project.client ? ` (${project.client.name})` : ''}`}
        breadcrumbs={[
          { label: "Projects", href: "#", onClick: onBack }
        ]}
        actions={
          <div className="flex items-center space-x-3">
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
            <Button 
              variant="secondary" 
              onClick={() => setShowBulkUploadModal(true)}
            >
              📁 Bulk Upload
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowAddJobModal(true)}
            >
              + Add Job
            </Button>
          </div>
        }
      />


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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'jobs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Jobs ({project.jobCount})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Project Information
          </button>
        </nav>
      </div>

      {/* Project Information Tab */}
      {activeTab === 'info' && (
        <>
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
                    {formatDateUtil(project.createdAt)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                  <p className="text-sm text-gray-900">
                    {formatDateUtil(project.updatedAt)}
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
        </>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <DataTable
            data={project.jobs || []}
            columns={columns}
            onRowClick={(job) => onJobSelect?.(job.id)}
            loading={false}
            emptyMessage="No jobs assigned to this project"
            columnPreferences={preferences}
            onColumnPreferencesChange={updatePreferences}
            resizableColumns={true}
          />
        </div>
      )}

      {/* Add Job Modal */}
      {project && (
        <AddJobModal
          isOpen={showAddJobModal}
          onClose={() => setShowAddJobModal(false)}
          onJobAdded={() => {
            setShowAddJobModal(false);
            fetchProject(); // Refresh project data to show new job
          }}
          projectId={project.id}
        />
      )}

      {/* Bulk Upload Modal */}
      {project && (
        <BulkUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onJobsAdded={() => {
            setShowBulkUploadModal(false);
            fetchProject(); // Refresh project data to show new jobs
          }}
          projectId={project.id}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
