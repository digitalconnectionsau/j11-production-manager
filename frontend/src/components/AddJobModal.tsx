import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, API_ENDPOINTS } from '../utils/api';

interface Project {
  id: number;
  name: string;
  clientId: number;
}

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: () => void;
  projectId?: number;
  projects?: Project[];
}

interface LeadTime {
  id: number;
  fromStatusId: number;
  toStatusId: number;
  days: number;
  direction: 'before' | 'after';
  isActive: boolean;
}

interface JobStatus {
  id: number;
  name: string;
  displayName: string;
  orderIndex: number;
}

interface Holiday {
  id: number;
  date: string;
  name: string;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onJobAdded, projectId, projects = [] }) => {
  const [formData, setFormData] = useState({
    projectId: projectId || '',
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
  const [leadTimes, setLeadTimes] = useState<LeadTime[]>([]);
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  const { token } = useAuth();

  // Load lead times, job statuses, and holidays when modal opens
  useEffect(() => {
    if (isOpen && token) {
      loadConfigurationData();
    }
  }, [isOpen, token]);

  const loadConfigurationData = async () => {
    try {
      // Load lead times, job statuses, and holidays
      const [leadTimesData, statusesData, holidaysData] = await Promise.all([
        apiRequest(API_ENDPOINTS.leadTimes, {}, token || ''),
        apiRequest(API_ENDPOINTS.jobStatuses, {}, token || ''),
        apiRequest(API_ENDPOINTS.holidays, {}, token || '')
      ]);

      setLeadTimes(leadTimesData.data);
      setJobStatuses(statusesData.data);
      setHolidays(holidaysData.data);
    } catch (err) {
      console.error('Error loading configuration data:', err);
    }
  };

  // Helper function to check if a date is a weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  // Helper function to check if a date is a holiday
  const isHoliday = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return holidays.some(holiday => holiday.date === dateString);
  };

  // Calculate working days before a given date
  const calculateWorkingDaysBefore = (fromDate: Date, workingDays: number) => {
    const result = new Date(fromDate);
    let daysToSubtract = 0;
    
    while (workingDays > 0) {
      daysToSubtract++;
      result.setDate(fromDate.getDate() - daysToSubtract);
      
      if (!isWeekend(result) && !isHoliday(result)) {
        workingDays--;
      }
    }
    
    return result;
  };

  // Calculate dates based on delivery date and lead times
  const calculateDatesFromDelivery = (deliveryDateString: string) => {
    if (!deliveryDateString || leadTimes.length === 0 || jobStatuses.length === 0) {
      return {};
    }

    try {
      // Parse delivery date (DD/MM/YYYY format)
      const [day, month, year] = deliveryDateString.split('/');
      const deliveryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      if (isNaN(deliveryDate.getTime())) {
        return {};
      }

      // Find status IDs for each stage
      const deliveredStatus = jobStatuses.find(s => s.name === 'delivered');
      const assemblyStatus = jobStatuses.find(s => s.name === 'assembly-complete');
      const machiningStatus = jobStatuses.find(s => s.name === 'machining-complete');
      const nestingStatus = jobStatuses.find(s => s.name === 'nesting-complete');

      if (!deliveredStatus) return {};

      const calculatedDates: Record<string, string> = {};

      // Calculate assembly date (before delivery)
      if (assemblyStatus) {
        const assemblyLeadTime = leadTimes.find(lt => 
          lt.fromStatusId === assemblyStatus.id && 
          lt.toStatusId === deliveredStatus.id && 
          lt.isActive && 
          lt.direction === 'before'
        );
        
        if (assemblyLeadTime && assemblyLeadTime.days > 0) {
          const assemblyDate = calculateWorkingDaysBefore(deliveryDate, assemblyLeadTime.days);
          calculatedDates.assemblyDate = formatDateForInput(assemblyDate);
        }
      }

      // Calculate machining date (before assembly or delivery)
      if (machiningStatus) {
        const machiningLeadTime = leadTimes.find(lt => 
          lt.fromStatusId === machiningStatus.id && 
          ((assemblyStatus && lt.toStatusId === assemblyStatus.id) || lt.toStatusId === deliveredStatus.id) &&
          lt.isActive && 
          lt.direction === 'before'
        );
        
        if (machiningLeadTime && machiningLeadTime.days > 0) {
          // Use assembly date as reference if available, otherwise delivery date
          const referenceDate = calculatedDates.assemblyDate 
            ? parseDateFromInput(calculatedDates.assemblyDate)
            : deliveryDate;
          
          if (referenceDate) {
            const machiningDate = calculateWorkingDaysBefore(referenceDate, machiningLeadTime.days);
            calculatedDates.machiningDate = formatDateForInput(machiningDate);
          }
        }
      }

      // Calculate nesting date (before machining, assembly, or delivery)
      if (nestingStatus) {
        const nestingLeadTime = leadTimes.find(lt => 
          lt.fromStatusId === nestingStatus.id && 
          ((machiningStatus && lt.toStatusId === machiningStatus.id) || 
           (assemblyStatus && lt.toStatusId === assemblyStatus.id) || 
           lt.toStatusId === deliveredStatus.id) &&
          lt.isActive && 
          lt.direction === 'before'
        );
        
        if (nestingLeadTime && nestingLeadTime.days > 0) {
          // Use the earliest available reference date
          const referenceDate = calculatedDates.machiningDate 
            ? parseDateFromInput(calculatedDates.machiningDate)
            : calculatedDates.assemblyDate 
              ? parseDateFromInput(calculatedDates.assemblyDate)
              : deliveryDate;
          
          if (referenceDate) {
            const nestingDate = calculateWorkingDaysBefore(referenceDate, nestingLeadTime.days);
            calculatedDates.nestingDate = formatDateForInput(nestingDate);
          }
        }
      }

      return calculatedDates;
    } catch (err) {
      console.error('Error calculating dates:', err);
      return {};
    }
  };

  // Helper function to format date for input field (DD/MM/YYYY)
  const formatDateForInput = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to parse date from input field (DD/MM/YYYY)
  const parseDateFromInput = (dateString: string) => {
    try {
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch {
      return null;
    }
  };

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
      const selectedProjectId = formData.projectId || projectId;
      if (!selectedProjectId) {
        setError('Please select a project');
        return;
      }

      const jobData = {
        projectId: selectedProjectId,
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

      await apiRequest(`/api/projects/${selectedProjectId}/jobs`, {
        method: 'POST',
        body: JSON.stringify(jobData)
      });

      onJobAdded();
      onClose();
        // Reset form
        setFormData({
          projectId: projectId || '',
          unit: '',
          type: '',
          items: '',
          status: 'not-started',
          nestingDate: '',
          machiningDate: '',
          assemblyDate: '',
          deliveryDate: '',
          comments: ''
        });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };

      // If delivery date is changed and it's valid, calculate other dates
      if (name === 'deliveryDate' && value && validateDate(value)) {
        const calculatedDates = calculateDatesFromDelivery(value);
        return {
          ...newFormData,
          ...calculatedDates
        };
      }

      return newFormData;
    });
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
            {/* Project Selection - only show if projects are provided and no specific projectId */}
            {projects.length > 0 && !projectId && (
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-black mb-2">
                  Project *
                </label>
                <select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-light-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Other dates will be calculated automatically)
                  </span>
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
