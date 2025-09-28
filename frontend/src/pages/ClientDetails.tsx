import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { apiRequest } from '../utils/api';
import AddProjectModal from '../components/AddProjectModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface Contact {
  id?: number;
  firstName: string;
  lastName: string;
  position?: string;
  email?: string;
  mobile?: string;
  directNumber?: string;
  isPrimary: boolean;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
  projects: Project[]; // Changed from number to Project array
  lastContact?: string;
  contacts?: Contact[];
  createdAt?: string;
  updatedAt?: string;
}

interface ClientDetailsProps {
  clientId: number;
  onBack: () => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ clientId, onBack }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'details'>('overview');
  
  // Modal states
  // @ts-ignore
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { token } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch client details
  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client details');
      }

      const data = await response.json();
      // Ensure projects is always an array
      data.projects = data.projects || [];
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client');
    } finally {
      setLoading(false);
    }
  };

  // Archive/unarchive client
  const handleArchiveClient = async () => {
    if (!client) return;
    
    try {
      setArchiveLoading(true);
      const response = await apiRequest(`/api/clients/${client.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !client.archived })
      }, token || '');

      if (response.success) {
        await fetchClient(); // Refresh client data
        setShowArchiveModal(false);
      } else {
        setError(response.error || `Failed to ${client.archived ? 'unarchive' : 'archive'} client`);
      }
    } catch (err) {
      setError(`Failed to ${client?.archived ? 'unarchive' : 'archive'} client`);
    } finally {
      setArchiveLoading(false);
    }
  };

  // Delete client
  const handleDeleteClient = async () => {
    if (!client) return;
    
    try {
      setDeleteLoading(true);
      const response = await apiRequest(`/api/clients/${client.id}`, {
        method: 'DELETE'
      }, token || '');

      if (response.success) {
        setShowDeleteModal(false);
        onBack(); // Navigate back to clients list
      } else {
        setError(response.error || 'Failed to delete client');
      }
    } catch (err) {
      setError('Failed to delete client');
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Companies
        </button>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Companies
        </button>
        <div className="text-gray-500">Company not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-primary hover:opacity-80 flex items-center"
        >
          ← Back to Companies
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-black">{client.name}</h1>
            {client.company && (
              <p className="text-lg text-charcoal mt-1">{client.company}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              client.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {client.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-grey mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'projects', label: 'Projects' },
            { key: 'details', label: 'Details' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-charcoal hover:text-black hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab client={client} />
      )}

      {activeTab === 'projects' && (
        <ProjectsTab 
          client={client} 
          onAddProject={() => setShowAddProjectModal(true)}
        />
      )}

      {activeTab === 'details' && (
        <DetailsTab 
          client={client} 
          onAddContact={() => setShowAddContactModal(true)}
          onArchive={() => setShowArchiveModal(true)}
          onDelete={() => setShowDeleteModal(true)}
        />
      )}

      {/* Modals */}
      <AddProjectModal
        isOpen={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        onProjectAdded={fetchClient}
        defaultClientId={client?.id}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleArchiveClient}
        title={`${client?.archived ? 'Unarchive' : 'Archive'} Client`}
        description={
          client?.archived 
            ? `Are you sure you want to unarchive "${client?.name}"? This will make the client and all associated projects and jobs visible again.`
            : `Are you sure you want to archive "${client?.name}"? This will hide the client and all associated projects and jobs from the main views, but they will remain in the database.`
        }
        confirmText=""
        confirmButtonText={client?.archived ? 'Unarchive' : 'Archive'}
        isLoading={archiveLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteClient}
        title="Delete Client"
        description={`Are you sure you want to permanently delete "${client?.name}"? This will also delete all associated projects, jobs, and contacts. This action cannot be undone.`}
        confirmText={`Please type the client name "${client?.name}" to confirm:`}
        confirmButtonText="Delete Permanently"
        requireNameTyping={true}
        expectedName={client?.name || ''}
        isDestructive={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ client: Client }> = ({ client }) => (
  <div className="space-y-6">
    {/* Key Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-light-grey p-4">
        <h3 className="text-sm font-medium text-charcoal mb-2">Total Projects</h3>
        <p className="text-3xl font-bold text-black">{client.projects?.length || 0}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-light-grey p-4">
        <h3 className="text-sm font-medium text-charcoal mb-2">Active Projects</h3>
        <p className="text-3xl font-bold text-black">
          {client.projects?.filter(p => p.status === 'active').length || 0}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-light-grey p-6">
        <h3 className="text-sm font-medium text-charcoal mb-2">Company Status</h3>
        <p className={`text-sm font-semibold ${client.isActive ? 'text-green-600' : 'text-red-600'}`}>
          {client.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>
    </div>

    {/* Quick Info */}
    <div className="bg-white rounded-lg shadow-sm border border-light-grey p-6">
      <h3 className="text-lg font-medium text-black mb-4">Company Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-charcoal mb-2">Contact Details</h4>
          <div className="space-y-2">
            {client.contactPerson && (
              <p className="text-sm text-black">Contact: {client.contactPerson}</p>
            )}
            {client.email && (
              <p className="text-sm text-primary">{client.email}</p>
            )}
            {client.phone && (
              <p className="text-sm text-black">{client.phone}</p>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-charcoal mb-2">Address</h4>
          <p className="text-sm text-black whitespace-pre-line">
            {client.address || 'No address provided'}
          </p>
        </div>
      </div>
      {client.notes && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-charcoal mb-2">Notes</h4>
          <p className="text-sm text-black whitespace-pre-line">{client.notes}</p>
        </div>
      )}
    </div>
  </div>
);

// Projects Tab Component
const ProjectsTab: React.FC<{ client: Client; onAddProject: () => void }> = ({ client, onAddProject }) => {
  const projects = client.projects || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-black">Projects</h3>
        <button
          onClick={onAddProject}
          className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-light-grey">
          <div className="mb-4">
            <p className="text-charcoal">No projects found</p>
            <p className="text-sm text-charcoal mt-2">
              This client doesn't have any projects yet.
            </p>
          </div>
          <button
            onClick={onAddProject}
            className="mt-4 text-primary hover:opacity-80 font-medium"
          >
            Add the first project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-light-grey p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-black mb-2">{project.name}</h4>
                  {project.description && (
                    <p className="text-charcoal text-sm mb-3">{project.description}</p>
                  )}
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    <span className="text-sm text-charcoal">
                      Created: {formatDate(project.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <button className="text-charcoal hover:text-primary text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Details Tab Component
const DetailsTab: React.FC<{ 
  client: Client; 
  onAddContact: () => void; 
  onArchive: () => void; 
  onDelete: () => void; 
}> = ({ client, onAddContact, onArchive, onDelete }) => (
  <div className="space-y-6">
    {/* Company Details */}
    <div className="bg-white rounded-lg shadow-sm border border-light-grey p-6">
      <h3 className="text-lg font-medium text-black mb-4">Company Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Company Name (Short)</label>
          <p className="text-sm text-black">{client.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Official Company Name</label>
          <p className="text-sm text-black">{client.company || 'Not provided'}</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-charcoal mb-1">Address</label>
          <p className="text-sm text-black whitespace-pre-line">{client.address || 'No address provided'}</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-charcoal mb-1">Notes</label>
          <p className="text-sm text-black whitespace-pre-line">{client.notes || 'No notes'}</p>
        </div>
      </div>
    </div>

    {/* Contacts */}
    <div className="bg-white rounded-lg shadow-sm border border-light-grey p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-black">Contacts</h3>
        <button
          onClick={onAddContact}
          className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Contact
        </button>
      </div>

      {/* Primary Contact (from existing data) */}
      {client.contactPerson && (
        <div className="border border-light-grey rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-black">{client.contactPerson}</h4>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary bg-opacity-10 text-primary">
                Primary Contact
              </span>
              <div className="mt-2 space-y-1">
                {client.email && (
                  <p className="text-sm text-charcoal">Email: {client.email}</p>
                )}
                {client.phone && (
                  <p className="text-sm text-charcoal">Phone: {client.phone}</p>
                )}
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 hover:underline font-medium px-2 py-1 rounded transition-colors text-sm">Edit</button>
          </div>
        </div>
      )}

      {/* Additional contacts would be listed here */}
      {(!client.contacts || client.contacts.length === 0) && !client.contactPerson && (
        <div className="text-center py-8">
          <p className="text-charcoal">No contacts added yet</p>
          <button
            onClick={onAddContact}
            className="mt-2 text-primary hover:opacity-80 font-medium"
          >
            Add the first contact
          </button>
        </div>
      )}
    </div>

    {/* Danger Zone */}
    <div className="mt-12 border-t border-gray-200 pt-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h3>
        <p className="text-red-700 mb-6">
          These actions are irreversible. Please be certain before proceeding.
        </p>
        
        <div className="space-y-4">
          {/* Archive/Unarchive Button */}
          <div className="flex items-center justify-between py-3 border-b border-red-200 last:border-b-0">
            <div>
              <h4 className="font-medium text-red-800">
                {client.archived ? 'Unarchive Client' : 'Archive Client'}
              </h4>
              <p className="text-sm text-red-600">
                {client.archived 
                  ? 'Make this client visible again in the main client list.'
                  : 'Hide this client from the main list. Projects and jobs will remain but be hidden.'
                }
              </p>
            </div>
            <button
              onClick={onArchive}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              {client.archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>

          {/* Delete Button */}
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-red-800">Delete Client</h4>
              <p className="text-sm text-red-600">
                Permanently delete this client and all associated projects, jobs, and contacts. This cannot be undone.
              </p>
            </div>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ClientDetails;
