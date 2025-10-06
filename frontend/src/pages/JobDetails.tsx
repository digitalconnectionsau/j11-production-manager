import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useScrollRestoration } from '../hooks/useScrollPosition';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import { calculateJobDates, type LeadTime, type JobStatus } from '../utils/dateCalculations';

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
  statusId?: number;
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

  // Maintain scroll position during data fetches
  useScrollRestoration(loading, `job-${jobId}`, 80);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Job>>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const statusOptions = [
    { value: 'not-assigned', label: 'Not Assigned' },
    { value: 'nesting-complete', label: 'Nesting Complete' },
    { value: 'machining-complete', label: 'Machining Complete' },
    { value: 'assembly-complete', label: 'Assembly Complete' },
    { value: 'delivered', label: 'Delivered' }
  ];

  // Get formatted status label
  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status.replace('-', ' ');
  };

  // Get next status in the cycle
  const getNextStatus = (currentStatus: string): JobStatus | null => {
    if (jobStatuses.length === 0) return null;
    const currentIndex = jobStatuses.findIndex(status => status.name === currentStatus);
    const nextIndex = (currentIndex + 1) % jobStatuses.length;
    return jobStatuses[nextIndex];
  };

  // Handle status cycling
  const handleStatusCycle = async () => {
    if (!job || saving || jobStatuses.length === 0) return;

    const nextStatus = getNextStatus(job.status);
    if (!nextStatus) return;
    
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...job, 
          status: nextStatus.name,
          statusId: nextStatus.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      const updatedJob = await response.json();
      setJob(updatedJob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchJob();
    fetchLeadTimes();
    fetchJobStatuses();
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

  // Fetch lead times
  const fetchLeadTimes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/lead-times`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lead times');
      }

      const data = await response.json();
      setLeadTimes(data);
    } catch (err) {
      console.error('Error fetching lead times:', err);
    }
  };

  // Fetch job statuses
  const fetchJobStatuses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/job-statuses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job statuses');
      }

      const data = await response.json();
      setJobStatuses(data);
    } catch (err) {
      console.error('Error fetching job statuses:', err);
    }
  };

  // Calculate dates based on delivery date and lead times
  const handleCalculateDates = async () => {
    if (!editForm.deliveryDate) {
      alert('Please enter a delivery date first');
      return;
    }

    try {
      setCalculating(true);
      
      // Ensure we have lead times and job statuses
      if (leadTimes.length === 0) {
        await fetchLeadTimes();
      }
      if (jobStatuses.length === 0) {
        await fetchJobStatuses();
      }

      const calculatedDates = calculateJobDates(editForm.deliveryDate, leadTimes, jobStatuses);
      
      // Update the edit form with calculated dates
      setEditForm(prev => ({
        ...prev,
        ...calculatedDates
      }));

    } catch (err) {
      console.error('Error calculating dates:', err);
      alert('Failed to calculate dates. Please try again.');
    } finally {
      setCalculating(false);
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

  const handleDelete = async () => {
    if (!job) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/jobs/${job.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Navigate back after successful deletion
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
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
    <div>
      <PageHeader
        title={`Job #${job.id} - ${job.items}`}
        description={job.projectName ? `Project: ${job.projectName}` : undefined}
        breadcrumbs={[
          { label: 'Projects', onClick: onBack },
          { label: job.projectName || 'Project', onClick: onBack },
          { label: `Job #${job.id}` }
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditing 
                  ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isEditing ? 'Cancel' : 'Edit Job'}
            </button>
            {!isEditing && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Job
              </button>
            )}
          </div>
        }
      />
      
      <div className="p-6">
        {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Job</h2>
            
            {/* Job Information - All in one row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

              <div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => {
                    const selectedStatus = jobStatuses.find(s => s.name === e.target.value);
                    setEditForm({ 
                      ...editForm, 
                      status: e.target.value as any,
                      statusId: selectedStatus?.id
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {jobStatuses.map(status => (
                    <option key={status.id} value={status.name}>
                      {status.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Fields - All in one row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nesting Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editForm.nestingDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, nestingDate: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDateValid('nestingDate') ? 'border-gray-300' : 'border-red-300'
                    }`}
                    placeholder="DD/MM/YYYY"
                  />
                  <input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        setEditForm({ ...editForm, nestingDate: `${day}/${month}/${year}` });
                      }
                    }}
                    className="absolute right-1 top-1 w-8 h-8 opacity-0 cursor-pointer"
                    title="Choose date"
                  />
                  <div className="absolute right-2 top-2 pointer-events-none">
                    📅
                  </div>
                </div>
                {!isDateValid('nestingDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machining Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editForm.machiningDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, machiningDate: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDateValid('machiningDate') ? 'border-gray-300' : 'border-red-300'
                    }`}
                    placeholder="DD/MM/YYYY"
                  />
                  <input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        setEditForm({ ...editForm, machiningDate: `${day}/${month}/${year}` });
                      }
                    }}
                    className="absolute right-1 top-1 w-8 h-8 opacity-0 cursor-pointer"
                    title="Choose date"
                  />
                  <div className="absolute right-2 top-2 pointer-events-none">
                    📅
                  </div>
                </div>
                {!isDateValid('machiningDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assembly Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editForm.assemblyDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, assemblyDate: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDateValid('assemblyDate') ? 'border-gray-300' : 'border-red-300'
                    }`}
                    placeholder="DD/MM/YYYY"
                  />
                  <input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        setEditForm({ ...editForm, assemblyDate: `${day}/${month}/${year}` });
                      }
                    }}
                    className="absolute right-1 top-1 w-8 h-8 opacity-0 cursor-pointer"
                    title="Choose date"
                  />
                  <div className="absolute right-2 top-2 pointer-events-none">
                    📅
                  </div>
                </div>
                {!isDateValid('assemblyDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editForm.deliveryDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDateValid('deliveryDate') ? 'border-gray-300' : 'border-red-300'
                    }`}
                    placeholder="DD/MM/YYYY"
                  />
                  <input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        setEditForm({ ...editForm, deliveryDate: `${day}/${month}/${year}` });
                      }
                    }}
                    className="absolute right-1 top-1 w-8 h-8 opacity-0 cursor-pointer"
                    title="Choose date"
                  />
                  <div className="absolute right-2 top-2 pointer-events-none">
                    📅
                  </div>
                </div>
                {!isDateValid('deliveryDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>
            </div>

            {/* Calculate Dates Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleCalculateDates}
                disabled={calculating || !editForm.deliveryDate}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {calculating ? 'Calculating...' : 'Calculate Dates'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                This will calculate all production dates based on your delivery date and configured lead times
              </p>
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
            
            {/* All job info in one row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <p className="text-sm text-gray-900 mt-1">{job.unit || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900 mt-1">{job.type || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <p className="text-sm text-gray-900 mt-1">{job.items}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status (click to cycle)</label>
                <button
                  onClick={handleStatusCycle}
                  disabled={saving}
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 transition-all hover:opacity-80 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-gray-300 ${getStatusColor(job.status)}`}
                  title={`Click to change to: ${getNextStatus(job.status)?.displayName || 'Next Status'}`}
                >
                  {saving ? 'Updating...' : getStatusLabel(job.status)}
                </button>
              </div>
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
            
            {/* All dates in one row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Job"
        description={`Are you sure you want to delete job #${job?.id} - ${job?.items}? This action cannot be undone.`}
        confirmText="This will permanently delete the job and all its data."
        confirmButtonText="Delete Job"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
};

export default JobDetails;