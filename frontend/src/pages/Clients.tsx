import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  status: string;
  projects: number;
  lastContact: string;
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

  // Delete client
  const deleteClient = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      // Refresh the clients list
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting client:', err);
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
              Search Clients
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, company, contact..."
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
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideInactive}
                onChange={(e) => setHideInactive(e.target.checked)}
                className="w-4 h-4 text-primary border-light-grey rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-charcoal">Hide Inactive</span>
            </label>
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
                    <span>Client</span>
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
                  Last Contact
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
                      {client.contactPerson && (
                        <div className="text-xs text-charcoal">Contact: {client.contactPerson}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black">{client.email}</div>
                    <div className="text-sm text-charcoal">{client.phone}</div>
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
                  <td className="px-6 py-4 text-sm text-black">
                    {client.lastContact}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button 
                      className="text-primary hover:opacity-80 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality - to be implemented
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteClient(client.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
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
      {showAddModal && (
        <AddClientModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={addClient}
        />
      )}
    </div>
  );
};

// Add Client Modal Component
interface AddClientModalProps {
  onClose: () => void;
  onSubmit: (clientData: { 
    name: string; 
    company: string; 
    email: string; 
    phone: string; 
    address?: string;
    contactPerson?: string;
    notes?: string;
  }) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Client name is required');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border border-light-grey">
        <h2 className="text-xl font-bold text-black mb-4">Add New Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Client Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter client name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter contact person name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter notes"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-charcoal bg-light-grey rounded-md hover:bg-opacity-80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-primary rounded-md hover:opacity-90 transition-colors"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Clients;
