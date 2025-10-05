import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { useTableShare } from '../hooks/useTableShare';
import { DataTable } from '../components/DataTable';
import type { TableColumn, FilterConfig, SortConfig, MultiSortConfig } from '../components/DataTable';
import Button from '../components/ui/Button';
import ErrorDisplay from '../components/ErrorDisplay';
import ProtectedRoute from '../components/ProtectedRoute';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // DataTable state
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    status: '',
    hideInactive: false
  });
  const [sort, setSort] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  const [multiSort, setMultiSort] = useState<MultiSortConfig[]>([]);

  // Column preferences
  const { preferences, updatePreferences } = useColumnPreferences('clients');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Helper function to get active filters description
  const getActiveFiltersDescription = () => {
    const activeFilters = [];
    if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
    if (filters.status && filters.status !== 'All') activeFilters.push(`Status: ${filters.status}`);
    if (filters.hideInactive) activeFilters.push('Hiding inactive clients');
    
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'All clients';
  };

  // Print and share functionality
  const { handlePrint, openShareView } = useTableShare({
    title: 'J11 Production Manager - Clients Report',
    subtitle: getActiveFiltersDescription()
  });

  // Custom renderers for table cells
  const createClientClickableCell = (value: any, row: Client, className?: string) => {
    const handleClientClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClientSelect(row.id);
    };

    return (
      <button
        onClick={handleClientClick}
        className={`text-gray-900 hover:text-gray-700 hover:underline text-left w-full ${className || ''}`}
      >
        {value || '-'}
      </button>
    );
  };

  // Helper function for status cell styling
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { backgroundColor: '#dcfce7', textColor: '#166534' }; // green-100/green-800
      case 'inactive':
        return { backgroundColor: '#f3f4f6', textColor: '#374151' }; // gray-100/gray-800
      default:
        return { backgroundColor: '#f3f4f6', textColor: '#374151' }; // gray-100/gray-800
    }
  };

  // Column definitions for DataTable
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Company',
      sortable: true,
      width: 200,
      render: (_value: string, row: Client) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {createClientClickableCell(row.name, row, 'font-medium')}
          </div>
          {row.company && (
            <div className="text-sm text-gray-500">{row.company}</div>
          )}
        </div>
      )
    },
    {
      key: 'contactPerson',
      label: 'Contact',
      sortable: true,
      width: 180,
      render: (_value: string, row: Client) => (
        <div>
          {row.contactPerson && (
            <div className="text-sm font-medium text-gray-900">
              {createClientClickableCell(row.contactPerson, row)}
            </div>
          )}
          {row.email && (
            <div className="text-sm text-gray-500">{row.email}</div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 100,
      cellStyle: (value: string) => ({
        backgroundColor: getStatusInfo(value).backgroundColor,
        color: getStatusInfo(value).textColor
      }),
      render: (value: string) => value
    },
    {
      key: 'projects',
      label: 'Projects',
      sortable: true,
      width: 80,
      render: (value: number, row: Client) => createClientClickableCell(value.toString(), row)
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: 80,
      render: (_value: any, row: Client) => (
        <button 
          className="text-orange-600 hover:text-orange-800 hover:underline font-medium px-2 py-1 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Edit functionality - to be implemented
            console.log('Edit client:', row.id);
          }}
        >
          Edit
        </button>
      )
    }
  ];

  // Define filters for DataTable
  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search clients, contacts...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'All', label: 'All Statuses' },
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'hideInactive',
      label: 'Hide Inactive',
      type: 'toggle'
    }
  ];

  // Load data function using callback pattern like Jobs and Projects
  const loadData = useCallback(async () => {
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
  }, [token, API_URL]);

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
      loadData();
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating client:', err);
    }
  };

  // Load data on component mount and when token changes
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [loadData, token]);

  return (
    <ProtectedRoute>
      <div className="p-6 print:p-0">
        <div className="flex justify-between items-center mb-6 print:mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 print:text-xl print:mb-1">Clients</h1>
            <div className="hidden print:block text-sm text-gray-600 mt-1">
              {getActiveFiltersDescription()} • Generated: {new Date().toLocaleString()}
            </div>
          </div>
          <div className="flex items-center space-x-3 print:hidden">
            <Button 
              variant="secondary" 
              onClick={() => {
                const visibleColumns = columns.filter(col => {
                  const pref = preferences.find(p => p.columnName === col.key);
                  return pref ? pref.isVisible : true;
                });
                openShareView(clients, columns, visibleColumns);
              }}
            >
              📤 Share
            </Button>
            <Button 
              variant="secondary" 
              onClick={handlePrint}
            >
              🖨️ Print
            </Button>
            <Button 
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              Add Client
            </Button>
          </div>
        </div>

        {error && (
          <ErrorDisplay 
            type="error" 
            message={error}
            onRetry={() => window.location.reload()}
            className="mb-4"
          />
        )}

        {multiSort.length > 0 && (
          <div className="mb-2 flex items-center justify-between print:hidden">
            <div className="text-sm text-gray-600 flex items-center space-x-2">
              <span>Multi-sort active:</span>
              {multiSort.map((sortItem) => (
                <span key={sortItem.field} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                  {sortItem.priority}. {columns.find(col => col.key === sortItem.field)?.label} {sortItem.direction === 'asc' ? '↑' : '↓'}
                </span>
              ))}
            </div>
            <button 
              onClick={() => setMultiSort([])}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all sorts
            </button>
          </div>
        )}
        
        <div className="mb-2 print:hidden">
          <div className="text-xs text-gray-500">
            💡 Tip: Click column headers to sort. Hold Ctrl/Cmd + click to add multiple sorts.
          </div>
        </div>

        <DataTable
          data={clients}
          columns={columns}
          loading={loading}
          error={error}
          filters={filterConfigs}
          currentFilters={filters}
          onFiltersChange={setFilters}
          defaultSort={sort}
          onSortChange={setSort}
          multiSort={multiSort}
          onMultiSortChange={setMultiSort}
          onRowClick={(client: Client) => onClientSelect(client.id)}
          columnPreferences={preferences}
          onColumnPreferencesChange={updatePreferences}
          resizableColumns={true}
          className="mb-8"
          emptyMessage="No clients found"
          emptySubMessage="Try adjusting your filters or create a new client"
        />
      </div>

      {/* Add Client Modal */}
      <AddClientModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addClient}
      />
    </ProtectedRoute>
  );
};

export default Clients;
