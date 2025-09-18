import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Job {
  id: number;
  projectId: number;
  unit: string;
  type: string;
  items: string;
  nestingDate: string | null;
  machiningDate: string | null;
  assemblyDate: string | null;
  deliveryDate: string | null;
  status: string;
  statusId: number;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  projectName: string;
  clientName: string;
  statusInfo: {
    id: number;
    name: string;
    displayName: string;
    color: string;
    backgroundColor: string;
    isDefault: boolean;
    isFinal: boolean;
    targetColumns?: string[];
  } | null;
}

interface Client {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  clientId: number;
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
  targetColumns?: string[];
}

interface JobsProps {
  onProjectSelect?: (projectId: number) => void;
  onJobSelect?: (jobId: number) => void;
}

const Jobs: React.FC<JobsProps> = ({ onProjectSelect, onJobSelect }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [hideCompleted, setHideCompleted] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting states
  const [sortField, setSortField] = useState<keyof Job>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { token } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, selectedClient, selectedProject, selectedStatus, dateFrom, dateTo, hideCompleted, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [jobsRes, clientsRes, projectsRes, statusesRes] = await Promise.all([
        fetch(`${API_URL}/api/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/clients`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/job-statuses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!jobsRes.ok || !clientsRes.ok || !projectsRes.ok || !statusesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [jobsData, clientsData, projectsData, statusesData] = await Promise.all([
        jobsRes.json(),
        clientsRes.json(),
        projectsRes.json(),
        statusesRes.json(),
      ]);

      setJobs(jobsData);
      setClients(clientsData);
      setProjects(projectsData);
      setStatuses(statusesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Client filter
    if (selectedClient) {
      filtered = filtered.filter(job => job.clientName === selectedClient);
    }

    // Project filter
    if (selectedProject) {
      filtered = filtered.filter(job => job.projectName === selectedProject);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }

    // Hide completed filter
    if (hideCompleted) {
      filtered = filtered.filter(job => job.statusInfo && !job.statusInfo.isFinal);
    }

    // Date range filter (using createdAt for now, could be extended to other date fields)
    if (dateFrom) {
      filtered = filtered.filter(job => new Date(job.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(job => new Date(job.createdAt) <= new Date(dateTo));
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.unit?.toLowerCase().includes(term) ||
        job.type?.toLowerCase().includes(term) ||
        job.items?.toLowerCase().includes(term) ||
        job.projectName?.toLowerCase().includes(term) ||
        job.clientName?.toLowerCase().includes(term) ||
        job.comments?.toLowerCase().includes(term)
      );
    }

    setFilteredJobs(filtered);
  };

  const handleSort = (field: keyof Job) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const getStatusStyle = (job: Job) => {
    if (!job.statusInfo) return { color: '#000', backgroundColor: '#f3f4f6' };
    return {
      color: job.statusInfo.color,
      backgroundColor: job.statusInfo.backgroundColor,
    };
  };

  const getColumnStyle = (job: Job, columnName: string) => {
    if (!job.statusInfo?.targetColumns || !job.statusInfo.targetColumns.includes(columnName)) {
      return {};
    }
    return {
      backgroundColor: job.statusInfo.backgroundColor,
      color: job.statusInfo.color,
    };
  };

  const clearAllFilters = () => {
    setSelectedClient('');
    setSelectedProject('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setHideCompleted(true);
  };

  const SortIcon = ({ field }: { field: keyof Job }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Jobs</h1>
          <p className="text-charcoal mt-1">
            View and manage all jobs across projects and clients
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Showing {sortedJobs.length} of {jobs.length} jobs
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-black">Filters</h2>
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Unit, type, items, etc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.name}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Projects</option>
              {projects
                .filter(project => !selectedClient || clients.find(c => c.name === selectedClient && c.id === project.clientId))
                .map(project => (
                  <option key={project.id} value={project.name}>
                    {project.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status.id} value={status.name}>
                  {status.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Hide Completed Toggle */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Hide Completed Jobs
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('unit')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Unit</span>
                    <SortIcon field="unit" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <SortIcon field="type" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('items')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Items</span>
                    <SortIcon field="items" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('clientName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Client</span>
                    <SortIcon field="clientName" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('projectName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Project</span>
                    <SortIcon field="projectName" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('nestingDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Nesting</span>
                    <SortIcon field="nestingDate" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('machiningDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Machining</span>
                    <SortIcon field="machiningDate" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('assemblyDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Assembly</span>
                    <SortIcon field="assemblyDate" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('deliveryDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Delivery</span>
                    <SortIcon field="deliveryDate" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.unit || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                    <button onClick={() => onProjectSelect?.(job.projectId)}>
                      {job.projectName}
                    </button>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    style={getColumnStyle(job, 'nesting')}
                  >
                    {job.nestingDate || '-'}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    style={getColumnStyle(job, 'machining')}
                  >
                    {job.machiningDate || '-'}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    style={getColumnStyle(job, 'assembly')}
                  >
                    {job.assemblyDate || '-'}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    style={getColumnStyle(job, 'delivery')}
                  >
                    {job.deliveryDate || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                      style={getStatusStyle(job)}
                    >
                      {job.statusInfo?.displayName || job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => onJobSelect?.(job.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sortedJobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No jobs found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;