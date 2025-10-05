import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import ConfirmationModal from '../ConfirmationModal';

interface ArchivedClient {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  archived: boolean;
  createdAt: string;
  projects: number;
}

const ArchivedClientsManagement: React.FC = () => {
  const [archivedClients, setArchivedClients] = useState<ArchivedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unarchiveModal, setUnarchiveModal] = useState<{ show: boolean; client: ArchivedClient | null }>({
    show: false,
    client: null
  });
  const [unarchiveLoading, setUnarchiveLoading] = useState(false);
  const { token } = useAuth();

  // Fetch archived clients
  const fetchArchivedClients = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/clients?includeArchived=true', {}, token || '');
      
      if (response.success) {
        // Filter only archived clients
        const archived = response.data.filter((client: ArchivedClient) => client.archived);
        setArchivedClients(archived);
      } else {
        setError('Failed to load archived clients');
      }
    } catch (err) {
      setError('Failed to load archived clients');
    } finally {
      setLoading(false);
    }
  };

  // Unarchive client
  const handleUnarchiveClient = async () => {
    if (!unarchiveModal.client) return;

    try {
      setUnarchiveLoading(true);
      const response = await apiRequest(`/api/clients/${unarchiveModal.client.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false })
      }, token || '');

      if (response.success) {
        await fetchArchivedClients(); // Refresh list
        setUnarchiveModal({ show: false, client: null });
      } else {
        setError('Failed to unarchive client');
      }
    } catch (err) {
      setError('Failed to unarchive client');
    } finally {
      setUnarchiveLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedClients();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Archived Clients</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Archived Clients</h2>
        <p className="text-gray-600 mt-1">
          Manage clients that have been archived. Archived clients and their projects are hidden from the main views.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {archivedClients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Archived Clients</h3>
          <p className="text-gray-600">
            No clients have been archived yet. Clients can be archived from their detail pages.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Archived Clients ({archivedClients.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archived Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archivedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        {client.company && (
                          <div className="text-sm text-gray-500">{client.company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.email && <div>{client.email}</div>}
                        {client.phone && <div>{client.phone}</div>}
                        {!client.email && !client.phone && (
                          <span className="text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.projects || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString('en-AU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setUnarchiveModal({ show: true, client })}
                        className="text-orange-600 hover:text-orange-900 transition-colors"
                      >
                        Unarchive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unarchive Confirmation Modal */}
      <ConfirmationModal
        isOpen={unarchiveModal.show}
        onClose={() => setUnarchiveModal({ show: false, client: null })}
        onConfirm={handleUnarchiveClient}
        title="Unarchive Client"
        description={`Are you sure you want to unarchive "${unarchiveModal.client?.name}"? This will make the client and all associated projects and jobs visible again in the main views.`}
        confirmText=""
        confirmButtonText="Unarchive"
        isLoading={unarchiveLoading}
      />
    </div>
  );
};

export default ArchivedClientsManagement;