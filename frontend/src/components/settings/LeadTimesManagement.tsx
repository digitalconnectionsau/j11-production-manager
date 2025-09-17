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

export interface LeadTime {
  id: number;
  fromStatusId: number;        // The status we're defining the lead time for
  toStatusId: number;          // The reference status (e.g., delivery)
  days: number;                // Number of working days
  direction: 'before' | 'after'; // Before or after the reference status
  isActive: boolean;           // Whether this lead time rule is active
}

interface LeadTimesManagementProps {}

const LeadTimesManagement: React.FC<LeadTimesManagementProps> = () => {
  const [statuses, setStatuses] = useState<JobStatus[]>([]);
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { token } = useAuth();

  // Load job statuses and lead times
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load job statuses
      const statusResponse = await fetch(`${API_URL}/api/job-statuses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to load job statuses');
      }

      const statusesData = await statusResponse.json();
      setStatuses(statusesData);

      // Load lead times from API
      const leadTimesResponse = await fetch(`${API_URL}/api/lead-times`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (leadTimesResponse.ok) {
        const leadTimesData = await leadTimesResponse.json();
        setLeadTimes(leadTimesData);
      } else {
        // If no lead times exist, initialize with defaults
        await initializeDefaultLeadTimes();
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadTime = async (leadTimeId: number, updates: Partial<LeadTime>) => {
    try {
      // Optimistic update
      setLeadTimes(prev => prev.map(lt => 
        lt.id === leadTimeId ? { ...lt, ...updates } : lt
      ));

      // API call to save lead time
      const response = await fetch(`${API_URL}/api/lead-times`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromStatusId: leadTimes.find(lt => lt.id === leadTimeId)?.fromStatusId,
          toStatusId: updates.toStatusId || leadTimes.find(lt => lt.id === leadTimeId)?.toStatusId,
          days: updates.days !== undefined ? updates.days : leadTimes.find(lt => lt.id === leadTimeId)?.days,
          direction: updates.direction || leadTimes.find(lt => lt.id === leadTimeId)?.direction,
          isActive: updates.isActive !== undefined ? updates.isActive : leadTimes.find(lt => lt.id === leadTimeId)?.isActive,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Lead time updated successfully!' });
      } else {
        throw new Error('Failed to save lead time');
      }
      
      setTimeout(() => setMessage(null), 3000);

    } catch (err) {
      console.error('Error updating lead time:', err);
      setMessage({ type: 'error', text: 'Failed to update lead time' });
      setTimeout(() => setMessage(null), 3000);
      
      // Revert optimistic update on error
      loadData();
    }
  };

  // Initialize default lead times via API
  const initializeDefaultLeadTimes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/lead-times/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Reload lead times after initialization
        const leadTimesResponse = await fetch(`${API_URL}/api/lead-times`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (leadTimesResponse.ok) {
          const leadTimesData = await leadTimesResponse.json();
          setLeadTimes(leadTimesData);
        }
      }
    } catch (err) {
      console.error('Error initializing default lead times:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading lead times...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Error loading lead times</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={loadData}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Lead Times Configuration</h2>
        <p className="text-gray-600 mt-1">
          Set the number of working days between job statuses. Default reference is the delivery date, 
          but you can set any status relative to another status.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Lead Times Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Status Lead Times</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leadTimes.map((leadTime) => {
                const fromStatus = statuses.find(s => s.id === leadTime.fromStatusId);
                if (!fromStatus) return null;

                return (
                  <tr key={leadTime.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: fromStatus.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">
                          {fromStatus.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={leadTime.days}
                        onChange={(e) => updateLeadTime(leadTime.id, { days: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={leadTime.direction}
                        onChange={(e) => updateLeadTime(leadTime.id, { direction: e.target.value as 'before' | 'after' })}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="before">Before</option>
                        <option value="after">After</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={leadTime.toStatusId}
                        onChange={(e) => updateLeadTime(leadTime.id, { toStatusId: parseInt(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        {statuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.displayName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={leadTime.isActive}
                          onChange={(e) => updateLeadTime(leadTime.id, { isActive: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Example Calculation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Example Calculation</h4>
        <p className="text-blue-800 text-sm">
          If delivery is scheduled for <strong>July 14th</strong> and Assembly is set to 
          <strong> 2 days before Delivery</strong>, then Assembly would be scheduled for 
          <strong> July 12th</strong> (or the previous working day if July 12th falls on a weekend or holiday).
        </p>
        <p className="text-blue-700 text-xs mt-2">
          Note: Actual job scheduling will account for weekends and holidays automatically.
        </p>
      </div>
    </div>
  );
};

export default LeadTimesManagement;