import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import ColumnManager from '../components/ColumnManager';
import ResizableColumnHeader from '../components/ResizableColumnHeader';

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
    targetColumns?: ColumnTarget[];
  } | null;
}

interface ColumnTarget {
  column: string;
  color: string;
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
  targetColumns?: ColumnTarget[];
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

  // Column management states
  const [showColumnManager, setShowColumnManager] = useState(false);
  
  // Define available columns
  const availableColumns = [
    'unit', 'type', 'items', 'projectName', 'nestingDate', 
    'machiningDate', 'assemblyDate', 'deliveryDate', 'status', 'actions'
  ];
  
  // Use column preferences hook
  const {
    preferences: columnPreferences,
    updatePreferences,
    updateSinglePreference,
    resetPreferences,
    getColumnVisibility,
    getColumnWidth,
    getColumnOrder,
  } = useColumnPreferences('jobs');

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

  const clearAllFilters = () => {
    setSelectedClient('');
    setSelectedProject('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setHideCompleted(true);
  };

  // Render table cell based on column name
  const renderTableCell = (job: Job, columnName: string) => {
    const key = `${job.id}-${columnName}`;
    switch (columnName) {
      case 'unit':
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {job.unit || '-'}
          </td>
        );
      case 'type':
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {job.type || '-'}
          </td>
        );
      case 'items':
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {job.items}
          </td>
        );
      case 'projectName':
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
            <button onClick={() => onProjectSelect?.(job.projectId)}>
              {job.projectName}
            </button>
          </td>
        );
      case 'nestingDate':
        return (
          <td 
            key={key}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            style={getColumnStyle(job, 'nesting')}
          >
            {job.nestingDate || '-'}
          </td>
        );
      case 'machiningDate':
        return (
          <td 
            key={key}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            style={getColumnStyle(job, 'machining')}
          >
            {job.machiningDate || '-'}
          </td>
        );
      case 'assemblyDate':
        return (
          <td 
            key={key}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            style={getColumnStyle(job, 'assembly')}
          >
            {job.assemblyDate || '-'}
          </td>
        );
      case 'deliveryDate':
        return (
          <td 
            key={key}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            style={getColumnStyle(job, 'delivery')}
          >
            {job.deliveryDate || '-'}
          </td>
        );
      case 'status':
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap">
            <span
              className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
              style={getStatusStyle(job)}
            >
              {job.statusInfo?.displayName || job.status}
            </span>
          </td>
        );
      case 'actions':
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <button
              onClick={() => onJobSelect?.(job.id)}
              className="text-blue-600 hover:text-blue-900"
            >
              View
            </button>
          </td>
        );
      default:
        return (
          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            -
          </td>
        );
    }
  };

  // Get visible columns in the correct order
  const getVisibleColumns = () => {
    if (columnPreferences.length === 0) {
      // Return default columns if no preferences are set
      return availableColumns.filter(col => col !== 'actions').concat(['actions']);
    }
    
    const orderedColumns = getColumnOrder();
    return orderedColumns.filter(col => getColumnVisibility(col)).concat(['actions']);
  };

  // Column configuration for the table
  const columnConfig = {
    unit: { label: 'Unit', sortable: true },
    type: { label: 'Type', sortable: true },
    items: { label: 'Items', sortable: true },
    projectName: { label: 'Project', sortable: true },
    nestingDate: { label: 'Nesting', sortable: true },
    machiningDate: { label: 'Machining', sortable: true },
    assemblyDate: { label: 'Assembly', sortable: true },
    deliveryDate: { label: 'Delivery', sortable: true },
    status: { label: 'Status', sortable: true },
    actions: { label: 'Actions', sortable: false },
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowColumnManager(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Columns</span>
            </button>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
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
                {getVisibleColumns().map((columnName) => {
                  const config = columnConfig[columnName as keyof typeof columnConfig];
                  const width = getColumnWidth(columnName);
                  
                  if (columnName === 'actions') {
                    return (
                      <th key={columnName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    );
                  }
                  
                  return (
                    <ResizableColumnHeader
                      key={columnName}
                      width={width}
                      onResize={(newWidth) => updateSinglePreference(columnName, { widthPx: newWidth })}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div 
                        className="flex items-center space-x-1"
                        onClick={() => config?.sortable && handleSort(columnName as keyof Job)}
                      >
                        <span>{config?.label || columnName}</span>
                        {config?.sortable && <SortIcon field={columnName as keyof Job} />}
                      </div>
                    </ResizableColumnHeader>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  {getVisibleColumns().map((columnName) => 
                    renderTableCell(job, columnName)
                  )}
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

      {/* Column Manager Modal */}
      <ColumnManager
        columns={availableColumns.filter(col => col !== 'actions')}
        preferences={columnPreferences}
        onUpdatePreferences={updatePreferences}
        onReset={resetPreferences}
        isOpen={showColumnManager}
        onClose={() => setShowColumnManager(false)}
      />
    </div>
  );
};

export default Jobs;