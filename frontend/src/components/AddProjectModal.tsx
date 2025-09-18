import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (project: any) => void;
  onProjectAdded?: () => Promise<void>;
  defaultClientId?: number;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onAdd, onProjectAdded, defaultClientId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: defaultClientId?.toString() || '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Array<{id: number, name: string}>>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [defaultClientName, setDefaultClientName] = useState<string>('');
  
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Update clientId when defaultClientId changes or modal opens
  useEffect(() => {
    if (isOpen && defaultClientId) {
      setFormData(prev => ({ ...prev, clientId: defaultClientId.toString() }));
    }
  }, [isOpen, defaultClientId]);

  // Fetch default client name when defaultClientId is provided
  useEffect(() => {
    const fetchDefaultClientName = async () => {
      if (isOpen && defaultClientId) {
        try {
          const response = await fetch(`${API_URL}/api/clients/${defaultClientId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            setDefaultClientName(data.name);
          }
        } catch (err) {
          console.error('Failed to fetch default client:', err);
        }
      }
    };

    fetchDefaultClientName();
  }, [isOpen, defaultClientId, token, API_URL]);

  // Fetch clients when modal opens (if no default client is set)
  useEffect(() => {
    const fetchClients = async () => {
      if (isOpen && !defaultClientId) {
        setLoadingClients(true);
        try {
          const response = await fetch(`${API_URL}/api/clients`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            setClients(data);
          }
        } catch (err) {
          console.error('Failed to fetch clients:', err);
        } finally {
          setLoadingClients(false);
        }
      }
    };

    fetchClients();
  }, [isOpen, defaultClientId, token, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const projectData = {
        name: formData.name,
        description: formData.description || null,
        clientId: parseInt(formData.clientId),
        dueDate: formData.dueDate || null
      };

      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        if (onProjectAdded) {
          await onProjectAdded();
        } else if (onAdd) {
          onAdd(projectData);
        }
        onClose();
        // Reset form
        setFormData({ 
          name: '', 
          description: '', 
          clientId: defaultClientId?.toString() || '', 
          dueDate: '' 
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create project');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Project</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Client
            </label>
            {defaultClientId ? (
              <div className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                {defaultClientName || `Client ID: ${defaultClientId}`}
              </div>
            ) : (
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                disabled={loadingClients}
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;
