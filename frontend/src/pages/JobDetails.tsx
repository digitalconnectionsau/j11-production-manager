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
  project?: {
    id: number;
    name: string;
  };
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
}

interface JobDetailsProps {
  jobId: number;
  projectId: number;
  onBack: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onBack }) => {
  const { token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Job>>({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  // Fetch job details
  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      setJob(data);
      setEditForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  // Update job
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      const updatedJob = await response.json();
      setJob(updatedJob);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Project
        </button>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Project
        </button>
        <div className="text-gray-500">Job not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Project
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            {job.project && (
              <p className="text-gray-600 mt-1">Project: {job.project.name}</p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {isEditing ? 'Cancel' : 'Edit Job'}
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Job</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={editForm.priority || ''}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Job description..."
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Job Details Display */
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(job.status)}`}>
                  {job.status.replace('-', ' ')}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getPriorityColor(job.priority)}`}>
                  {job.priority}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {job.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            )}

            {job.assignedTo && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <p className="text-sm text-gray-900 mt-1">
                  {job.assignedTo.name} ({job.assignedTo.email})
                </p>
              </div>
            )}
          </div>

          {/* Timeline/Activity */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm text-gray-600">
                  Job created on {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
              {job.updatedAt !== job.createdAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm text-gray-600">
                    Last updated on {new Date(job.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
