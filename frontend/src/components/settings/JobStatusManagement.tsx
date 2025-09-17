import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface JobStatus {
  id: number;
  name: string;
  displayName: string;
  color: string;
  backgroundColor: string;
  orderIndex: number;
  isDefault: boolean;
  isFinal: boolean;
}

interface JobStatusManagementProps {
  // Add any props if needed
}

const JobStatusManagement: React.FC<JobStatusManagementProps> = () => {
  const [statuses, setStatuses] = useState<JobStatus[]>([]);
  const [editingStatus, setEditingStatus] = useState<JobStatus | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    color: '#1976d2',
    backgroundColor: '#e3f2fd',
  });

  const { token } = useAuth();

  const colors = [
    '#1976d2', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f43f5e'
  ];

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/job-statuses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch statuses');
      const data = await response.json();
      setStatuses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = () => {
    setIsAddMode(true);
    setFormData({ name: '', displayName: '', color: '#1976d2', backgroundColor: '#e3f2fd' });
  };

  const handleEditStatus = (status: JobStatus) => {
    setEditingStatus(status);
    setFormData({ 
      name: status.name, 
      displayName: status.displayName, 
      color: status.color, 
      backgroundColor: status.backgroundColor 
    });
  };

  const handleSaveStatus = async () => {
    try {
      setLoading(true);
      const url = isAddMode ? `${API_URL}/api/job-statuses` : `${API_URL}/api/job-statuses/${editingStatus?.id}`;
      const method = isAddMode ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save status');
      
      await fetchStatuses();
      handleCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async (statusId: number) => {
    if (!confirm('Are you sure you want to delete this status?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/job-statuses/${statusId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete status');
      
      await fetchStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsAddMode(false);
    setEditingStatus(null);
    setFormData({ name: '', displayName: '', color: '#1976d2', backgroundColor: '#e3f2fd' });
  };

  const moveStatus = async (fromIndex: number, toIndex: number) => {
    const newStatuses = [...statuses];
    const [movedStatus] = newStatuses.splice(fromIndex, 1);
    newStatuses.splice(toIndex, 0, movedStatus);

    // Update local state immediately
    setStatuses(newStatuses);

    // Send reorder request to backend
    try {
      const newOrder = newStatuses.map((item, index) => ({
        id: item.id,
        orderIndex: index + 1,
      }));

      const response = await fetch(`${API_URL}/api/job-statuses/reorder`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ statusOrders: newOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder statuses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder statuses');
      // Revert on error
      fetchStatuses();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black">Manage Job Statuses</h2>
          <p className="text-charcoal mt-1">Customize your job statuses with colors and ordering</p>
        </div>
        <button
          onClick={handleAddStatus}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add Status
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAddMode || editingStatus) && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium text-black mb-4">
            {isAddMode ? 'Add New Status' : 'Edit Status'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Status Name (internal)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., in-progress"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., In Progress"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Text Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-md border-2 ${
                      formData.color === color ? 'border-black' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Background Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => {
                  // Generate lighter background colors
                  const bgColor = color + '20'; // Add transparency
                  return (
                    <button
                      key={`bg-${color}`}
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundColor: bgColor })}
                      className={`w-8 h-8 rounded-md border-2 ${
                        formData.backgroundColor === bgColor ? 'border-black' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: bgColor }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveStatus}
              disabled={loading || !formData.name.trim() || !formData.displayName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status List */}
      <div className="space-y-2">
        {statuses.map((status, index) => (
          <div
            key={status.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <div className="cursor-move text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    color: status.color,
                    backgroundColor: status.backgroundColor 
                  }}
                >
                  {status.displayName}
                </span>
                {status.isDefault && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border">
                    Default
                  </span>
                )}
                {status.isFinal && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded border">
                    Final
                  </span>
                )}
              </div>

              {/* Order */}
              <span className="text-sm text-gray-500">Order: {status.orderIndex}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEditStatus(status)}
                disabled={loading || isAddMode || !!editingStatus}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteStatus(status.id)}
                disabled={loading || status.isDefault || isAddMode || !!editingStatus}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              {/* Move Up/Down buttons */}
              {index > 0 && (
                <button
                  onClick={() => moveStatus(index, index - 1)}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
              {index < statuses.length - 1 && (
                <button
                  onClick={() => moveStatus(index, index + 1)}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && statuses.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading statuses...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && statuses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No statuses found. Add your first status above.</p>
        </div>
      )}
    </div>
  );
};

export default JobStatusManagement;
