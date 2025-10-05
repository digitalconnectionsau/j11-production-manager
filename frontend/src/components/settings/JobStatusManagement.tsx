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
  targetColumns?: ColumnTarget[];
}

interface ColumnTarget {
  column: string;
  color: string;
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
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('#1976d2');
  const [formData, setFormData] = useState({
    displayName: '',
    color: '#ffffff', // Default to white text
    backgroundColor: '#1976d2', // Default background
    targetColumns: [] as ColumnTarget[], // Column targeting with colors
  });

  const { token } = useAuth();

  // Helper function to generate internal name from display name
  const generateInternalName = (displayName: string): string => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Load color history from existing statuses
  const loadColorHistory = (statusList: JobStatus[]) => {
    const colors = statusList.map(status => status.backgroundColor);
    const uniqueColors = [...new Set(colors)];
    setColorHistory(uniqueColors);
  };

  // Common background colors for quick selection
  const commonColors = [
    '#1976d2', '#dc2626', '#ea580c', '#d97706', '#65a30d',
    '#059669', '#0891b2', '#7c3aed', '#c2410c', '#be185d'
  ];

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/job-statuses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch statuses');
      
      const statusList = await response.json();
      setStatuses(statusList);
      loadColorHistory(statusList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = () => {
    setIsAddMode(true);
    setFormData({ displayName: '', color: '#ffffff', backgroundColor: '#1976d2', targetColumns: [] });
    setCustomColor('#1976d2');
  };

  const handleEditStatus = (status: JobStatus) => {
    setEditingStatus(status);
    setFormData({ 
      displayName: status.displayName, 
      color: status.color, 
      backgroundColor: status.backgroundColor,
      targetColumns: status.targetColumns || []
    });
    setCustomColor(status.backgroundColor);
  };

  const handleSaveStatus = async () => {
    try {
      setLoading(true);
      const internalName = generateInternalName(formData.displayName);
      const url = isAddMode ? `${API_URL}/api/job-statuses` : `${API_URL}/api/job-statuses/${editingStatus?.id}`;
      const method = isAddMode ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name: internalName,
          displayName: formData.displayName,
          color: formData.color,
          backgroundColor: formData.backgroundColor,
          targetColumns: formData.targetColumns,
        }),
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
    setFormData({ displayName: '', color: '#ffffff', backgroundColor: '#1976d2', targetColumns: [] });
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

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, backgroundColor: color });
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setFormData({ ...formData, backgroundColor: color });
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
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium text-black mb-4">
            {isAddMode ? 'Add New Status' : 'Edit Status'}
          </h3>
          
          {/* Status Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Status Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="e.g., In Progress"
            />
            <p className="text-xs text-gray-500 mt-1">
              Internal name will be auto-generated: {formData.displayName ? generateInternalName(formData.displayName) : 'in-progress'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Background Color Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
                Background Color
              </label>
              
              {/* Custom Color Input */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="#1976d2"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              {/* Common Colors */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Common Colors:</p>
                <div className="flex gap-2 flex-wrap">
                  {commonColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        formData.backgroundColor === color ? 'border-black scale-110' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Previously Used Colors */}
              {colorHistory.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Previously Used:</p>
                  <div className="flex gap-2 flex-wrap">
                    {colorHistory.map((color) => (
                      <button
                        key={`history-${color}`}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        className={`w-8 h-8 rounded-md border-2 transition-all ${
                          formData.backgroundColor === color ? 'border-black scale-110' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Text Color Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
                Text Color
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, color: '#ffffff' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.color === '#ffffff' 
                      ? 'border-black bg-gray-100' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
                  <span>White</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, color: '#000000' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.color === '#000000' 
                      ? 'border-black bg-gray-100' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-6 h-6 bg-black rounded"></div>
                  <span>Black</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column Targeting */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-black">
                Column Targeting Rules
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    targetColumns: [...formData.targetColumns, { column: 'nesting', color: '#1976d2' }]
                  });
                }}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Rule
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Create multiple targeting rules to color different columns with different colors when this status is active.
            </p>
            
            <div className="space-y-3">
              {formData.targetColumns.map((target, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {/* Column Selection */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Column</label>
                    <select
                      value={target.column}
                      onChange={(e) => {
                        const newTargets = [...formData.targetColumns];
                        newTargets[index] = { ...newTargets[index], column: e.target.value };
                        setFormData({ ...formData, targetColumns: newTargets });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="nesting">Nesting</option>
                      <option value="machining">Machining</option>
                      <option value="assembly">Assembly</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>

                  {/* Color Selection */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={target.color}
                        onChange={(e) => {
                          const newTargets = [...formData.targetColumns];
                          newTargets[index] = { ...newTargets[index], color: e.target.value };
                          setFormData({ ...formData, targetColumns: newTargets });
                        }}
                        className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={target.color}
                        onChange={(e) => {
                          const newTargets = [...formData.targetColumns];
                          newTargets[index] = { ...newTargets[index], color: e.target.value };
                          setFormData({ ...formData, targetColumns: newTargets });
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="#1976d2"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newTargets = formData.targetColumns.filter((_, i) => i !== index);
                      setFormData({ ...formData, targetColumns: newTargets });
                    }}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove rule"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {formData.targetColumns.length === 0 && (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  No column targeting rules. Click "Add Rule" to create one.
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-black mb-2">
              Preview
            </label>
            <div className="inline-block">
              <span
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ 
                  color: formData.color,
                  backgroundColor: formData.backgroundColor 
                }}
              >
                {formData.displayName || 'Status Name'}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSaveStatus}
              disabled={loading || !formData.displayName.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Internal Name & Order */}
              <div className="text-sm text-gray-500">
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                  {status.name}
                </span>
                Order: {status.orderIndex}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEditStatus(status)}
                disabled={loading || isAddMode || !!editingStatus}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
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
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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