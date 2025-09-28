import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface JobData {
  unit: string;
  type: string;
  items: string;
  status: string;
  nestingDate: string;
  machiningDate: string;
  assemblyDate: string;
  deliveryDate: string;
  comments: string;
  rowIndex: number;
  errors: string[];
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobsAdded: () => void;
  projectId: number;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onJobsAdded, projectId }) => {
  const [parsedJobs, setParsedJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'uploading'>('select');
  const [uploadResults, setUploadResults] = useState<{success: number, failed: number, errors: string[]}>({ success: 0, failed: 0, errors: [] });
  
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const validStatuses = ['not-assigned', 'nesting-complete', 'machining-complete', 'assembly-complete', 'delivered'];

  // Validate date format DD/MM/YYYY
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true; // Empty is valid
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    return regex.test(dateString);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Reset previous state
    setError('');
    setParsedJobs([]);
    setUploadStep('select');
    
    // Accept both CSV and TSV files, and text files that might be tab-separated
    const validTypes = ['text/csv', 'text/tab-separated-values', 'text/plain', 'application/vnd.ms-excel'];
    const validExtensions = ['.csv', '.tsv', '.txt'];
    
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    const hasValidExtension = validExtensions.includes(`.${fileExtension}`);
    const hasValidType = validTypes.includes(selectedFile.type);
    
    if (hasValidExtension || hasValidType || selectedFile.type === '') {
      // Many systems don't set MIME types correctly for CSV files, so we're more lenient
      parseCSV(selectedFile);
    } else {
      setError(`Please select a CSV, TSV, or text file. Selected: ${selectedFile.type || 'unknown type'}`);
    }
  };

  const parseCSV = async (csvFile: File) => {
    try {
      setError('');
      setLoading(true);
      
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
      console.log('Detected headers:', headers);
      
      // Handle both tab-separated and comma-separated values
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headerRow = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
      
      console.log('Using delimiter:', delimiter === '\t' ? 'tab' : 'comma');
      console.log('Headers:', headerRow);

      const jobs: JobData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
        const errors: string[] = [];
        
        // Map your CSV format to our expected format
        const getValueByHeader = (possibleHeaders: string[]) => {
          for (const header of possibleHeaders) {
            const index = headerRow.indexOf(header);
            if (index !== -1 && values[index]) {
              return values[index];
            }
          }
          return '';
        };

        // Status mapping
        const mapStatus = (statusValue: string): string => {
          const status = statusValue.toLowerCase();
          if (status.includes('delivery complete') || status.includes('delivered')) return 'delivered';
          if (status.includes('assembly complete') || status.includes('assembly')) return 'assembly-complete';
          if (status.includes('machining complete') || status.includes('machining')) return 'machining-complete';
          if (status.includes('nesting complete') || status.includes('nesting')) return 'nesting-complete';
          if (status.includes('not assigned') || status.includes('not-assigned')) return 'not-assigned';
          return 'not-assigned'; // default
        };

        // Date cleaning - handle #VALUE! and other Excel errors
        const cleanDate = (dateStr: string): string => {
          if (!dateStr || dateStr === '#VALUE!' || dateStr === '#REF!' || dateStr === '#N/A') {
            return '';
          }
          // If already in DD/MM/YYYY format, return as is
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            return dateStr;
          }
          // Try to parse other common date formats
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            }
          } catch (e) {
            console.warn('Could not parse date:', dateStr);
          }
          return '';
        };
        
        const job: JobData = {
          unit: getValueByHeader(['unit', 'job', 'job number']),
          type: getValueByHeader(['type', 'unit type']),
          items: getValueByHeader(['items', 'description', 'item']),
          status: mapStatus(getValueByHeader(['status', 'job status'])),
          nestingDate: cleanDate(getValueByHeader(['nesting', 'nesting date', 'nesting_date'])),
          machiningDate: cleanDate(getValueByHeader(['machining', 'machining date', 'machining_date'])),
          assemblyDate: cleanDate(getValueByHeader(['assembly', 'assembly date', 'assembly_date'])),
          deliveryDate: cleanDate(getValueByHeader(['delivery', 'delivery date', 'delivery_date'])),
          comments: getValueByHeader(['comments', 'notes', 'comment']),
          rowIndex: i + 1,
          errors: []
        };

        // Validate required fields
        if (!job.items) {
          errors.push('Items is required');
        }

        // Validate status
        if (job.status && !validStatuses.includes(job.status)) {
          errors.push(`Invalid status: ${job.status} (mapped from original)`);
        }

        // Validate dates (only if they have values)
        if (job.nestingDate && !validateDate(job.nestingDate)) {
          errors.push('Invalid nesting date format (use DD/MM/YYYY)');
        }
        if (job.machiningDate && !validateDate(job.machiningDate)) {
          errors.push('Invalid machining date format (use DD/MM/YYYY)');
        }
        if (job.assemblyDate && !validateDate(job.assemblyDate)) {
          errors.push('Invalid assembly date format (use DD/MM/YYYY)');
        }
        if (job.deliveryDate && !validateDate(job.deliveryDate)) {
          errors.push('Invalid delivery date format (use DD/MM/YYYY)');
        }

        job.errors = errors;
        jobs.push(job);
      }

      console.log('Parsed jobs:', jobs.slice(0, 3)); // Log first 3 for debugging
      setParsedJobs(jobs);
      setUploadStep('preview');
      
    } catch (err) {
      console.error('CSV parsing error:', err);
      setError('Failed to parse CSV file. Please check the format. Make sure it uses tabs or commas as separators.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const validJobs = parsedJobs.filter(job => job.errors.length === 0);
    
    if (validJobs.length === 0) {
      setError('No valid jobs to upload. Please fix the errors first.');
      return;
    }

    setLoading(true);
    setUploadStep('uploading');

    try {
      const jobsData = validJobs.map(job => ({
        projectId,
        unit: job.unit || null,
        type: job.type || null,
        items: job.items,
        status: job.status || 'not-assigned',
        nestingDate: job.nestingDate || null,
        machiningDate: job.machiningDate || null,
        assemblyDate: job.assemblyDate || null,
        deliveryDate: job.deliveryDate || null,
        comments: job.comments || null
      }));

      const response = await fetch(`${API_URL}/api/projects/${projectId}/jobs/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs: jobsData }),
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResults({
          success: result.created || validJobs.length,
          failed: parsedJobs.length - validJobs.length,
          errors: parsedJobs.filter(job => job.errors.length > 0).map(job => `Row ${job.rowIndex}: ${job.errors.join(', ')}`)
        });
        onJobsAdded();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload jobs');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setParsedJobs([]);
    setError('');
    setUploadStep('select');
    setUploadResults({ success: 0, failed: 0, errors: [] });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Bulk Upload Jobs</h2>
            <button
              onClick={handleClose}
              className="text-charcoal hover:text-black text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Step 1: File Selection */}
          {uploadStep === 'select' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-light-grey rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <h3 className="text-lg font-medium text-black mb-2">Upload CSV/TSV File</h3>
                    <p className="text-charcoal mb-4">
                      Upload a CSV, TSV, or tab-separated file with job data. Flexible header matching supports your Excel export format.
                    </p>
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="csvFile"
                    />
                    <label
                      htmlFor="csvFile"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 cursor-pointer transition-all"
                    >
                      Choose File
                    </label>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      <p className="font-medium mb-1">✅ Your format is supported!</p>
                      <p>• Handles Customer, Job, Unit, Type, Items, Nesting, Machining, Assembly, Delivery, Status</p>
                      <p>• Auto-fixes #VALUE! and Excel errors</p>
                      <p>• Maps statuses like "Delivery Complete" → "delivered"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CSV Format Example */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-black mb-2">Expected CSV Format:</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`Unit,Type,Items,Status,Nesting Date,Machining Date,Assembly Date,Delivery Date,Comments
L5,B1.28/29,Substrates,not-assigned,15/08/2025,,,,"First floor units"
B1,All Units,Kitchen & Butlers,nesting-complete,10/08/2025,12/08/2025,,,"Premium finishes"`}
                </pre>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {uploadStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-black">
                  Preview Jobs ({parsedJobs.length} total, {parsedJobs.filter(j => j.errors.length === 0).length} valid)
                </h3>
                <button
                  onClick={() => setUploadStep('select')}
                  className="text-primary hover:opacity-80"
                >
                  Choose Different File
                </button>
              </div>

              <div className="max-h-96 overflow-auto border border-light-grey rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedJobs.map((job, index) => (
                      <tr key={index} className={job.errors.length > 0 ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 text-charcoal">{job.rowIndex}</td>
                        <td className="px-3 py-2 text-charcoal">{job.unit}</td>
                        <td className="px-3 py-2 text-charcoal">{job.type}</td>
                        <td className="px-3 py-2 text-charcoal">{job.items}</td>
                        <td className="px-3 py-2 text-charcoal">{job.status}</td>
                        <td className="px-3 py-2">
                          {job.errors.length > 0 ? (
                            <span className="text-red-600 text-xs">{job.errors.join(', ')}</span>
                          ) : (
                            <span className="text-green-600 text-xs">✓ Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-light-grey text-charcoal rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading || parsedJobs.filter(j => j.errors.length === 0).length === 0}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Upload {parsedJobs.filter(j => j.errors.length === 0).length} Valid Jobs
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Results */}
          {uploadStep === 'uploading' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-charcoal">Uploading jobs...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-black">Upload Complete</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{uploadResults.success}</div>
                      <div className="text-green-700">Jobs Created</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{uploadResults.failed}</div>
                      <div className="text-red-700">Jobs Failed</div>
                    </div>
                  </div>

                  {uploadResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                      <ul className="text-sm text-red-600 space-y-1">
                        {uploadResults.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
