import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AddClientModal from '../components/AddClientModal';

interface Client {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  archived?: boolean;
  status: string;
  projects: number;
}

interface ClientsProps {
  onClientSelect: (clientId: number) => void;
}

const Clients: React.FC<ClientsProps> = ({ onClientSelect }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [hideInactive, setHideInactive] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'contactPerson' | 'status' | 'projects'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch clients from API
  const fetchClients = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new client
  const addClient = async (clientData: { 
    name: string; 
    company: string; 
    email: string; 
    phone: string; 
    address?: string;
    contactPerson?: string;
    notes?: string;
  }) => {
    try {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      // Refresh the clients list
      fetchClients();
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating client:', err);
    }
  };

  // Filter and sort logic
  const applyFiltersAndSort = () => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Apply hide inactive toggle
    if (hideInactive) {
      filtered = filtered.filter(client => client.isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'contactPerson':
          aVal = (a.contactPerson || '').toLowerCase();
          bVal = (b.contactPerson || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case 'projects':
          aVal = a.projects;
          bVal = b.projects;
          break;
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredClients(filtered);
  };

  // Handle sort column click
  const handleSort = (field: 'name' | 'contactPerson' | 'status' | 'projects') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [clients, searchTerm, statusFilter, hideInactive, sortField, sortDirection]);

  useEffect(() => {
    if (token) {
      fetchClients();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-charcoal">Loading clients...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Clients</h1>
          <p className="text-charcoal mt-2">Manage your client relationships</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Client
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md border border-light-grey p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Search Companies
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company name, contact person..."
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Sort By
            </label>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [typeof sortField, typeof sortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="contactPerson-asc">Contact (A-Z)</option>
              <option value="contactPerson-desc">Contact (Z-A)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
              <option value="projects-desc">Projects (High-Low)</option>
              <option value="projects-asc">Projects (Low-High)</option>
            </select>
          </div>

          {/* Hide Inactive Toggle */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Hide Inactive
            </label>
            <div className="flex items-center h-10">
              <label className="flex items-center space-x-3 cursor-pointer">
                <span className="text-sm text-charcoal">Off</span>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    hideInactive ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  onClick={() => setHideInactive(!hideInactive)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      hideInactive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-sm text-charcoal">On</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-charcoal">
            Showing {filteredClients.length} of {clients.length} clients
            {searchTerm && (
              <span className="ml-2 text-primary">
                (filtered by "{searchTerm}")
              </span>
            )}
          </div>
          
          {/* Reset Filters Button */}
          {(searchTerm || statusFilter !== 'All' || hideInactive || sortField !== 'name' || sortDirection !== 'asc') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setHideInactive(false);
                setSortField('name');
                setSortDirection('asc');
              }}
              className="text-sm text-primary hover:opacity-80 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-md border border-light-grey overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-charcoal text-lg mb-2">
              {clients.length === 0 ? 'No clients found' : 'No clients match your filters'}
            </div>
            <p className="text-charcoal">
              {clients.length === 0 
                ? 'Get started by adding your first client' 
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-light-grey">
              <tr>
                <th 
                  className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Company</span>
                    {sortField === 'name' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
                  onClick={() => handleSort('contactPerson')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Contact</span>
                    {sortField === 'contactPerson' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortField === 'status' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider cursor-pointer hover:bg-opacity-80"
                  onClick={() => handleSort('projects')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Projects</span>
                    {sortField === 'projects' && (
                      <span className="text-primary">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-charcoal uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-grey">
              {filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-light-grey cursor-pointer"
                  onClick={() => onClientSelect(client.id)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-black">{client.name}</div>
                      {client.company && (
                        <div className="text-sm text-charcoal">{client.company}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {client.contactPerson && (
                        <div className="text-sm font-medium text-black">{client.contactPerson}</div>
                      )}
                      {client.email && (
                        <div className="text-sm text-charcoal">{client.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-light-grey text-charcoal'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {client.projects}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium px-2 py-1 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality - to be implemented
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Add Client Modal */}
      <AddClientModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addClient}
      />
    </div>
  );
};

export default Clients;
