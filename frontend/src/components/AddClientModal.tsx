import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  position?: string;
  email?: string;
  phone?: string;
  office?: string;
  isPrimary: boolean;
}

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (client: any) => void;
  onSubmit?: (clientData: any) => Promise<void>;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onAdd, onSubmit }) => {
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const [formData, setFormData] = useState({
    // Business Information
    name: '',
    company: '',
    address: '',
    phone: '',
    email: '',
    abn: '',
    // Contact Information
    contactName: '',
    contactPosition: '',
    contactEmail: '',
    contactPhone: '',
    contactOffice: '',
    useExistingContact: false,
    selectedContactId: ''
  });

  const [existingContacts, setExistingContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingContacts();
    }
  }, [isOpen]);

  const fetchExistingContacts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const contacts = await response.json();
        setExistingContacts(contacts);
      }
    } catch (err) {
      console.error('Failed to fetch existing contacts:', err);
    }
  };

  const handleExistingContactSelect = (contactId: string) => {
    const contact = existingContacts.find(c => c.id.toString() === contactId);
    if (contact) {
      setFormData(prev => ({
        ...prev,
        selectedContactId: contactId,
        contactName: `${contact.firstName} ${contact.lastName}`,
        contactPosition: contact.position || '',
        contactEmail: contact.email || '',
        contactPhone: contact.phone || '',
        contactOffice: contact.office || ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Prepare client data
      const clientData = {
        name: formData.name,
        company: formData.company || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        abn: formData.abn || null,
      };

      let createdClient;
      
      if (onSubmit) {
        await onSubmit(clientData);
      } else if (onAdd) {
        onAdd(clientData);
      } else {
        // Default API call to create client
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

        createdClient = await response.json();

        // Create contact if contact details provided and not using existing contact
        if (!formData.useExistingContact && formData.contactName) {
          const [firstName, ...lastNameParts] = formData.contactName.split(' ');
          const lastName = lastNameParts.join(' ') || '';

          const contactData = {
            clientId: createdClient.id,
            firstName,
            lastName,
            position: formData.contactPosition || null,
            email: formData.contactEmail || null,
            phone: formData.contactPhone || null,
            office: formData.contactOffice || null,
            isPrimary: true,
          };

          await fetch(`${API_URL}/api/contacts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData),
          });
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        company: '',
        address: '',
        phone: '',
        email: '',
        abn: '',
        contactName: '',
        contactPosition: '',
        contactEmail: '',
        contactPhone: '',
        contactOffice: '',
        useExistingContact: false,
        selectedContactId: ''
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Add New Client</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Business Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name (Short) *
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="J11 Productions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name (Legal)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="J11 Productions Pty Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Address
                </label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Business St, Gold Coast QLD 4000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(07) 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@j11productions.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ABN
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.abn}
                  onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                  placeholder="12 345 678 901"
                />
              </div>
            </div>

            {/* Right Column - Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Primary Contact</h3>
              
              {existingContacts.length > 0 && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.useExistingContact}
                      onChange={(e) => setFormData({ ...formData, useExistingContact: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Use existing contact</span>
                  </label>
                </div>
              )}

              {formData.useExistingContact && existingContacts.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Existing Contact
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.selectedContactId}
                    onChange={(e) => handleExistingContactSelect(e.target.value)}
                  >
                    <option value="">Select a contact...</option>
                    {existingContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName} - {contact.email}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.contactPosition}
                      onChange={(e) => setFormData({ ...formData, contactPosition: e.target.value })}
                      placeholder="Project Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="john.smith@j11productions.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="(07) 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Office
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.contactOffice}
                      onChange={(e) => setFormData({ ...formData, contactOffice: e.target.value })}
                      placeholder="Gold Coast Office"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
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
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
