import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  id: number;
  projectId: number;
  unit?: string;
  type?: string;
  items: string;
  nestingDate?: string;
  machiningDate?: string;
  assemblyDate?: string;
  deliveryDate?: string;
  status: 'not-assigned' | 'nesting-complete' | 'machining-complete' | 'assembly-complete' | 'delivered';
  comments?: string;
  createdAt: string;
  updatedAt: string;
  projectName?: string;
  clientName?: string;
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
  const [saving, setSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const statusOptions = [
    { value: 'not-assigned', label: 'Not Assigned' },
    { value: 'nesting-complete', label: 'Nesting Complete' },
    { value: 'machining-complete', label: 'Machining Complete' },
    { value: 'assembly-complete', label: 'Assembly Complete' },
    { value: 'delivered', label: 'Delivered' }
  ];

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  // Helper function to parse DD/MM/YYYY format dates
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Helper function to format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = parseDate(dateString);
    return date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '-';
  };

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

  // Save job changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    try {
      setSaving(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'assembly-complete':
        return 'bg-blue-100 text-blue-800';
      case 'machining-complete':
        return 'bg-indigo-100 text-indigo-800';
      case 'nesting-complete':
        return 'bg-purple-100 text-purple-800';
      case 'not-assigned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Date validation for DD/MM/YYYY format
  const validateDate = (dateString: string) => {
    if (!dateString) return true; // Empty is valid
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    return regex.test(dateString);
  };

  const isDateValid = (field: string) => {
    return validateDate(editForm[field as keyof typeof editForm] as string);
  };

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Project
        </button>
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
          className="mb-4 text-primary hover:opacity-80 flex items-center"
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
          className="mb-4 text-primary hover:opacity-80 flex items-center"
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
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Project
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Job #{job.id} - {job.items}
            </h1>
            {job.projectName && (
              <p className="text-gray-600 mt-1">Project: {job.projectName}</p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditing 
                ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                : 'bg-primary hover:opacity-90 text-white'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit Job'}
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Job</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={editForm.unit || ''}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. L5, B1, 1003"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={editForm.type || ''}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. B1.28/29, All Units, SPA"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items *
              </label>
              <input
                type="text"
                value={editForm.items || ''}
                onChange={(e) => setEditForm({ ...editForm, items: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Substrates, Kitchen & Butlers"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={editForm.status || ''}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nesting Date
                </label>
                <input
                  type="text"
                  value={editForm.nestingDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, nestingDate: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDateValid('nestingDate') ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('nestingDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machining Date
                </label>
                <input
                  type="text"
                  value={editForm.machiningDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, machiningDate: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDateValid('machiningDate') ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('machiningDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assembly Date
                </label>
                <input
                  type="text"
                  value={editForm.assemblyDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, assemblyDate: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDateValid('assemblyDate') ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('assemblyDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="text"
                  value={editForm.deliveryDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDateValid('deliveryDate') ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('deliveryDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                value={editForm.comments || ''}
                onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Additional comments..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(job);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <p className="text-sm text-gray-900 mt-1">{job.unit || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900 mt-1">{job.type || 'Not specified'}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <p className="text-sm text-gray-900 mt-1">{job.items}</p>
            </div>

            {job.comments && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Comments</label>
                <p className="text-sm text-gray-900 mt-1">{job.comments}</p>
              </div>
            )}
          </div>

          {/* Date Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nesting Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(job.nestingDate || '')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Machining Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(job.machiningDate || '')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assembly Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(job.assemblyDate || '')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(job.deliveryDate || '')}</p>
              </div>
            </div>
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