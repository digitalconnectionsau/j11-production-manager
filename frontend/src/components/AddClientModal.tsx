import React, { useState } from 'react';

interface AddClientModalProps {
  isOpen: boolean;
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

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    notes: ''
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        notes: ''
      });
    }
  }, [isOpen]);

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl border border-light-grey max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-black mb-6">Add New Client</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Information - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Company Name (Short) *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What you call them (e.g., ABC Builders)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Quick reference name for daily use</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Official Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Legal/trading name (e.g., ABC Construction Pty Ltd)"
              />
              <p className="text-xs text-gray-500 mt-1">Full legal or trading name</p>
            </div>
          </div>

          {/* Contact Information - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Additional Information - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
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
                rows={3}
                className="w-full px-3 py-2 border border-light-grey rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter notes"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-light-grey">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-charcoal bg-light-grey rounded-md hover:bg-opacity-80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-primary rounded-md hover:opacity-90 transition-colors"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
