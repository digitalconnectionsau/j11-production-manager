import React, { useState, useCallback } from 'react';

interface ImportManagementProps {
  // Add any props if needed
}

type ImportType = 'clients' | 'projects' | 'jobs';

interface ImportStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface CsvData {
  headers: string[];
  rows: string[][];
  preview: string[][];
}

// Database field mappings for each import type
const DATABASE_FIELDS = {
  clients: [
    { value: 'name', label: 'Client Name', required: true },
    { value: 'email', label: 'Email', required: false },
    { value: 'phone', label: 'Phone', required: false },
    { value: 'address', label: 'Address', required: false },
    { value: 'contact_person', label: 'Contact Person', required: false },
    { value: 'notes', label: 'Notes', required: false },
  ],
  projects: [
    { value: 'name', label: 'Project Name', required: true },
    { value: 'client_name', label: 'Client Name', required: true },
    { value: 'description', label: 'Description', required: false },
    { value: 'status', label: 'Status', required: false },
    { value: 'start_date', label: 'Start Date', required: false },
    { value: 'end_date', label: 'End Date', required: false },
    { value: 'budget', label: 'Budget', required: false },
  ],
  jobs: [
    { value: 'unit', label: 'Unit', required: true },
    { value: 'type', label: 'Type', required: true },
    { value: 'items', label: 'Items', required: true },
    { value: 'project_name', label: 'Project Name', required: true },
    { value: 'nesting', label: 'Nesting', required: false },
    { value: 'machining', label: 'Machining', required: false },
    { value: 'assembly', label: 'Assembly', required: false },
    { value: 'delivery', label: 'Delivery', required: false },
    { value: 'status', label: 'Status', required: false },
  ],
};

const ImportManagement: React.FC<ImportManagementProps> = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [importType, setImportType] = useState<'clients' | 'projects' | 'jobs' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<{[csvColumn: string]: string}>({});

  const steps: ImportStep[] = [
    {
      id: 1,
      title: 'Select Import Type',
      description: 'Choose what type of data you want to import',
      completed: false,
      active: currentStep === 1,
    },
    {
      id: 2,
      title: 'Upload CSV File',
      description: 'Upload your CSV file containing the data',
      completed: false,
      active: currentStep === 2,
    },
    {
      id: 3,
      title: 'Map Columns',
      description: 'Map your CSV columns to the correct fields',
      completed: false,
      active: currentStep === 3,
    },
    {
      id: 4,
      title: 'Preview & Validate',
      description: 'Review your data and check for errors',
      completed: false,
      active: currentStep === 4,
    },
    {
      id: 5,
      title: 'Import Data',
      description: 'Import your data into the system',
      completed: false,
      active: currentStep === 5,
    },
  ];

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile || uploadedFile.type !== 'text/csv') {
      setError('Please upload a valid CSV file');
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setFile(uploadedFile);

    try {
      const text = await uploadedFile.text();
      const parsed = parseCSV(text);
      setCsvData(parsed);
    } catch (err) {
      setError('Failed to parse CSV file. Please check the format.');
      console.error('CSV parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text: string): CsvData => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    // Create preview (first 5 rows)
    const preview = rows.slice(0, 5);

    return {
      headers,
      rows,
      preview
    };
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv');
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError('Please drop a valid CSV file');
    }
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      handleFileUpload(uploadedFile);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
              <div className="flex items-center">
                <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  step.completed 
                    ? 'bg-green-600' 
                    : step.active 
                      ? 'border-2 border-blue-600 bg-white' 
                      : 'border-2 border-gray-300 bg-white'
                }`}>
                  {step.completed ? (
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`text-sm font-medium ${
                      step.active ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.id}
                    </span>
                  )}
                </div>
                <div className="ml-4 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.active ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
              {stepIdx !== steps.length - 1 && (
                <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          What would you like to import?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'clients', label: 'Clients', description: 'Import client information', icon: '👥' },
            { id: 'projects', label: 'Projects', description: 'Import project data', icon: '📁' },
            { id: 'jobs', label: 'Jobs', description: 'Import job records', icon: '⚡' },
            { id: 'all', label: 'All Data', description: 'Import everything from one file', icon: '📊' },
          ].map((type) => (
            <div
              key={type.id}
              onClick={() => setImportType(type.id as ImportType)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                importType === type.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{type.icon}</div>
                <h4 className="font-medium text-gray-900">{type.label}</h4>
                <p className="text-sm text-gray-500 mt-1">{type.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep(2)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Upload CSV File
        </h3>
        <p className="text-gray-600 mb-6">
          Upload a CSV file containing your {importType || 'selected'} data. The first row should contain column headers.
        </p>

        <div 
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">Processing CSV file...</p>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {file ? file.name : 'Drop your CSV file here, or click to browse'}
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileInputChange}
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-500">CSV files only, up to 10MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-sm text-green-700">
                File uploaded successfully: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!file}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!csvData || !importType) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Please complete the previous steps first.</p>
        </div>
      );
    }

    // Type assertion after null check to satisfy TypeScript
    const validImportType = importType as 'clients' | 'projects' | 'jobs';
    const availableFields = DATABASE_FIELDS[validImportType];
    
    if (!availableFields) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Invalid import type selected. Please go back and select a valid import type.</p>
        </div>
      );
    }

    const requiredFields = availableFields.filter(field => field.required);
    const optionalFields = availableFields.filter(field => !field.required);

    const handleColumnMapping = (csvColumn: string, dbField: string) => {
      setColumnMapping(prev => {
        const newMapping = { ...prev };
        if (dbField === '') {
          delete newMapping[csvColumn];
        } else {
          newMapping[csvColumn] = dbField;
        }
        return newMapping;
      });
    };

    const getMappedField = (csvColumn: string): string => {
      return columnMapping[csvColumn] || '';
    };

    const getUnmappedRequiredFields = (): string[] => {
      const mappedValues = Object.values(columnMapping);
      return requiredFields
        .filter(field => !mappedValues.includes(field.value))
        .map(field => field.label);
    };

    const canProceed = getUnmappedRequiredFields().length === 0;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map CSV Columns to Database Fields</h3>
          <p className="text-sm text-gray-600">
            Match your CSV columns to the corresponding database fields. Required fields must be mapped.
          </p>
        </div>

        {/* Column Mapping Table */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CSV Column
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sample Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Map to Database Field
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {csvData.headers.map((header, index) => (
                <tr key={header}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {header}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {csvData.preview[0] && csvData.preview[0][index] ? 
                      csvData.preview[0][index] : 
                      '(empty)'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={getMappedField(header)}
                      onChange={(e) => handleColumnMapping(header, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">-- Select Field --</option>
                      <optgroup label="Required Fields">
                        {requiredFields.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label} *
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Optional Fields">
                        {optionalFields.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Required Fields Status */}
        {getUnmappedRequiredFields().length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Required fields not mapped
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The following required fields must be mapped before proceeding:</p>
                  <ul className="mt-1 list-disc list-inside">
                    {getUnmappedRequiredFields().map(field => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(2)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Previous
          </button>
          <button
            onClick={() => canProceed && setCurrentStep(4)}
            disabled={!canProceed}
            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              canProceed
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Next: Preview Data
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return <div className="text-center py-8 text-gray-500">Preview & validation coming soon...</div>;
      case 5:
        return <div className="text-center py-8 text-gray-500">Import process coming soon...</div>;
      default:
        return renderStep1();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black">Import Data</h2>
        <p className="text-charcoal mt-1">
          Import clients, projects, or jobs from CSV files
        </p>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Current Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {renderCurrentStep()}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Import Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• CSV files should have headers in the first row</li>
          <li>• Dates should be in DD/MM/YYYY format</li>
          <li>• For jobs import, ensure projects and clients exist first</li>
          <li>• Use "All Data" to import everything from a single organized file</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportManagement;