import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: () => void;
  projectId: number;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onJobAdded, projectId }) => {
  const [formData, setFormData] = useState({
    unit: '',
    type: '',
    items: '',
    status: 'not-assigned',
    nestingDate: '',
    machiningDate: '',
    assemblyDate: '',
    deliveryDate: '',
    comments: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const statusOptions = [
    { value: 'not-assigned', label: 'Not Assigned' },
    { value: 'nesting-complete', label: 'Nesting Complete' },
    { value: 'machining-complete', label: 'Machining Complete' },
    { value: 'assembly-complete', label: 'Assembly Complete' },
    { value: 'delivered', label: 'Delivered' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const jobData = {
        projectId,
        unit: formData.unit || null,
        type: formData.type || null,
        items: formData.items,
        status: formData.status,
        nestingDate: formData.nestingDate || null,
        machiningDate: formData.machiningDate || null,
        assemblyDate: formData.assemblyDate || null,
        deliveryDate: formData.deliveryDate || null,
        comments: formData.comments || null
      };

      const response = await fetch(`${API_URL}/api/projects/${projectId}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        onJobAdded();
        onClose();
        // Reset form
        setFormData({
          unit: '',
          type: '',
          items: '',
          status: 'not-assigned',
          nestingDate: '',
          machiningDate: '',
          assemblyDate: '',
          deliveryDate: '',
          comments: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create job');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Date validation for DD/MM/YYYY format
  const validateDate = (dateString: string) => {
    if (!dateString) return true; // Empty is valid
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    return regex.test(dateString);
  };

  const isDateValid = (field: string) => {
    return validateDate(formData[field as keyof typeof formData] as string);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Add New Job</h2>
            <button
              onClick={onClose}
              className="text-charcoal hover:text-black text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unit */}
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-black mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., L5, B1, 1003"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-black mb-2">
                  Type
                </label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., B1.28/29, All Units, SPA"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <label htmlFor="items" className="block text-sm font-medium text-black mb-2">
                Items *
              </label>
              <input
                type="text"
                id="items"
                name="items"
                value={formData.items}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="e.g., Substrates, Kitchen & Butlers"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-black mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nesting Date */}
              <div>
                <label htmlFor="nestingDate" className="block text-sm font-medium text-black mb-2">
                  Nesting Date
                </label>
                <input
                  type="text"
                  id="nestingDate"
                  name="nestingDate"
                  value={formData.nestingDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    !isDateValid('nestingDate') ? 'border-red-500' : 'border-light-grey'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('nestingDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              {/* Machining Date */}
              <div>
                <label htmlFor="machiningDate" className="block text-sm font-medium text-black mb-2">
                  Machining Date
                </label>
                <input
                  type="text"
                  id="machiningDate"
                  name="machiningDate"
                  value={formData.machiningDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    !isDateValid('machiningDate') ? 'border-red-500' : 'border-light-grey'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('machiningDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              {/* Assembly Date */}
              <div>
                <label htmlFor="assemblyDate" className="block text-sm font-medium text-black mb-2">
                  Assembly Date
                </label>
                <input
                  type="text"
                  id="assemblyDate"
                  name="assemblyDate"
                  value={formData.assemblyDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    !isDateValid('assemblyDate') ? 'border-red-500' : 'border-light-grey'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('assemblyDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>

              {/* Delivery Date */}
              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-medium text-black mb-2">
                  Delivery Date
                </label>
                <input
                  type="text"
                  id="deliveryDate"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    !isDateValid('deliveryDate') ? 'border-red-500' : 'border-light-grey'
                  }`}
                  placeholder="DD/MM/YYYY"
                />
                {!isDateValid('deliveryDate') && (
                  <p className="text-red-500 text-xs mt-1">Please use DD/MM/YYYY format</p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-black mb-2">
                Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Additional notes or comments"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-light-grey text-charcoal rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.items.trim() || 
                  !isDateValid('nestingDate') || !isDateValid('machiningDate') || 
                  !isDateValid('assemblyDate') || !isDateValid('deliveryDate')}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Job'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddJobModal;
