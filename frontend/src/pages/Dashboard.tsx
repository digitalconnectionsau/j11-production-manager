import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  period: string;
  date: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    nested: number;
    machined: number;
    assembled: number;
    delivered: number;
    totalJobs: number;
    totalClients: number;
    totalProjects: number;
  };
  recentActivity: {
    nested: JobActivity[];
    machined: JobActivity[];
    assembled: JobActivity[];
    delivered: JobActivity[];
  };
}

interface JobActivity {
  jobId: number;
  items: string;
  projectName: string;
  clientName: string;
  date: string;
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'nested' | 'machined' | 'assembled' | 'delivered'>('nested');
  const [timePeriod, setTimePeriod] = useState<'day' | 'work-week' | 'month' | 'year'>('day');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/analytics/analytics?period=${timePeriod === 'work-week' ? 'week' : timePeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'day': return 'Today';
      case 'work-week': return 'This Work Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'Today';
    }
  };

  const getTabData = () => {
    if (!analyticsData) return [];
    return analyticsData.recentActivity[activeTab] || [];
  };

  const getTabCount = () => {
    if (!analyticsData) return 0;
    return analyticsData.summary[activeTab] || 0;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-charcoal mt-2">Loading analytics...</p>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-red-600 mt-2">Error: {error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-charcoal mt-2">Production analytics for {getTimePeriodLabel().toLowerCase()}</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Nested {getTimePeriodLabel()}</p>
              <p className="text-2xl font-bold text-black">{analyticsData?.summary.nested || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">�</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Machined {getTimePeriodLabel()}</p>
              <p className="text-2xl font-bold text-black">{analyticsData?.summary.machined || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Assembled {getTimePeriodLabel()}</p>
              <p className="text-2xl font-bold text-black">{analyticsData?.summary.assembled || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔨</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Delivered {getTimePeriodLabel()}</p>
              <p className="text-2xl font-bold text-black">{analyticsData?.summary.delivered || 0}</p>
            </div>
            <div className="w-12 h-12 bg-light-grey rounded-lg flex items-center justify-center">
              <span className="text-2xl">�</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Activity Details */}
      <div className="bg-white rounded-lg shadow-md border border-light-grey">
        {/* Tab Headers with Time Period Selector */}
        <div className="border-b border-light-grey p-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              {(['nested', 'machined', 'assembled', 'delivered'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-primary text-white'
                      : 'text-charcoal hover:bg-light-grey'
                  }`}
                >
                  {tab} ({analyticsData?.summary[tab] || 0})
                </button>
              ))}
            </div>
            
            {/* Time Period Selector */}
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="day">Day</option>
              <option value="work-week">Work Week (Mon-Fri)</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-black mb-4 capitalize">
            {activeTab} Items - {getTabCount()} total
          </h3>
          
          {getTabData().length === 0 ? (
            <div className="text-center py-8 text-charcoal">
              <span className="text-4xl mb-4 block">📋</span>
              <p>No {activeTab} items for {getTimePeriodLabel().toLowerCase()}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-light-grey">
                    <th className="text-left py-3 px-4 font-medium text-charcoal">Job ID</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal">Project</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {getTabData().map((item, index) => (
                    <tr key={`${item.jobId}-${index}`} className="border-b border-light-grey hover:bg-light-grey">
                      <td className="py-3 px-4 text-sm font-medium text-black">#{item.jobId}</td>
                      <td className="py-3 px-4 text-sm text-black">{item.items}</td>
                      <td className="py-3 px-4 text-sm text-charcoal">{item.projectName}</td>
                      <td className="py-3 px-4 text-sm text-charcoal">{item.clientName}</td>
                      <td className="py-3 px-4 text-sm text-charcoal">{item.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
