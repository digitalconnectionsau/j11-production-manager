import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
    { value: 'client_name', label: 'Customer/Client', required: false },
    { value: 'nesting', label: 'Nesting', required: false },
    { value: 'machining', label: 'Machining', required: false },
    { value: 'assembly', label: 'Assembly', required: false },
    { value: 'delivery', label: 'Delivery', required: false },
    { value: 'status', label: 'Status', required: false },
    { value: 'comments', label: 'Comments', required: false },
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
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  // Add pagination state at component level to avoid hooks rule violation
  const [previewCurrentPage, setPreviewCurrentPage] = useState(1);
  const [showAllPreviewRows, setShowAllPreviewRows] = useState(false);

  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const steps: ImportStep[] = [
    {
      id: 1,
      title: 'Select Import Type',
      description: 'Choose what type of data you want to import',
      completed: !!importType,
      active: currentStep === 1,
    },
    {
      id: 2,
      title: 'Upload CSV File',
      description: 'Upload your CSV file containing the data',
      completed: !!(file && csvData),
      active: currentStep === 2,
    },
    {
      id: 3,
      title: 'Map Columns',
      description: 'Map your CSV columns to the correct fields',
      completed: false, // We'll determine this based on required field mapping
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
      completed: !!importResults,
      active: currentStep === 5,
    },
    {
      id: 6,
      title: 'Complete',
      description: 'Import completed successfully',
      completed: !!importResults,
      active: currentStep === 6,
    },
  ];

  const handleFileUpload = async (uploadedFile: File) => {
    // Check file extension instead of MIME type (more reliable for CSV files)
    const fileName = uploadedFile.name.toLowerCase();
    if (!uploadedFile || !fileName.endsWith('.csv')) {
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
      console.log('File uploaded:', uploadedFile.name, 'Size:', uploadedFile.size);
      console.log('File content preview:', text.substring(0, 200));
      const parsed = parseCSV(text);
      console.log('Parsed CSV data:', parsed);
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
    const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'));
    
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'clients', label: 'Clients', description: 'Import client information', icon: '👥' },
            { id: 'projects', label: 'Projects', description: 'Import project data', icon: '📁' },
            { id: 'jobs', label: 'Jobs', description: 'Import job records', icon: '⚡' },
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
          disabled={!file || !csvData || isProcessing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Next Step'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!csvData || !importType) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Please complete the previous steps first.</p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Import Type: {importType ? '✓' : '✗'}</p>
            <p>CSV Data: {csvData ? '✓' : '✗'}</p>
            <p>File: {file ? file.name : 'None'}</p>
          </div>
          <div className="mt-4 space-x-2">
            {!importType && (
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Select Import Type
              </button>
            )}
            {!csvData && importType && (
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Upload CSV File
              </button>
            )}
          </div>
        </div>
      );
    }

    // Type assertion after null check to satisfy TypeScript
    const validImportType = importType as 'clients' | 'projects' | 'jobs';
    console.log('renderStep3: importType =', importType, 'validImportType =', validImportType);
    const availableFields = DATABASE_FIELDS[validImportType];
    console.log('availableFields =', availableFields);
    
    if (!availableFields) {
      console.error('No fields found for import type:', validImportType);
      return (
        <div className="text-center py-8">
          <p className="text-red-500">Invalid import type selected. Please go back and select a valid import type.</p>
          <p className="text-sm text-gray-500 mt-2">Debug: Import type is "{validImportType}"</p>
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

  const renderStep4 = () => {
    if (!csvData || !importType) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Please complete the previous steps first.</p>
        </div>
      );
    }

    // Use component-level pagination state (defined at top of component)
    const rowsPerPage = 10;

    // Create mapped data for preview
    const mappedData = csvData.rows.map((row, index) => {
      const mappedRow: any = {};
      csvData.headers.forEach((header, headerIndex) => {
        const dbField = columnMapping[header];
        if (dbField) {
          mappedRow[dbField] = row[headerIndex] || '';
        }
      });
      return { ...mappedRow, rowIndex: index + 1 };
    });

    // Validation
    const validImportType = importType as 'clients' | 'projects' | 'jobs';
    const availableFields = DATABASE_FIELDS[validImportType];
    const requiredFields = availableFields.filter(field => field.required);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if all required fields are mapped
    const mappedFieldValues = Object.values(columnMapping);
    const unmappedRequired = requiredFields.filter(field => !mappedFieldValues.includes(field.value));
    
    if (unmappedRequired.length > 0) {
      errors.push(`Missing required fields: ${unmappedRequired.map(f => f.label).join(', ')}`);
    }

    // Validate data quality
    let validRows = 0;
    const rowErrors: Array<{row: number, errors: string[]}> = [];

    mappedData.forEach((row, index) => {
      const rowErrorList: string[] = [];
      
      requiredFields.forEach(field => {
        if (!row[field.value] || row[field.value].toString().trim() === '') {
          rowErrorList.push(`${field.label} is required`);
        }
      });

      if (rowErrorList.length === 0) {
        validRows++;
      } else {
        rowErrors.push({ row: index + 2, errors: rowErrorList }); // +2 because +1 for header, +1 for 1-based indexing
      }
    });

    if (rowErrors.length > 0) {
      warnings.push(`${rowErrors.length} rows have validation errors`);
    }

    const canProceed = errors.length === 0;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Preview & Validate
          </h3>
          <p className="text-gray-600 mb-6">
            Review your data before importing. Check for any errors or warnings below.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{csvData.rows.length}</div>
            <div className="text-sm text-blue-600">Total Rows</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{validRows}</div>
            <div className="text-sm text-green-600">Valid Rows</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{rowErrors.length}</div>
            <div className="text-sm text-yellow-600">Rows with Warnings</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{errors.length}</div>
            <div className="text-sm text-red-600">Critical Errors</div>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">❌ Critical Errors</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
            <p className="text-sm text-red-600 mt-2 italic">
              These errors must be fixed before you can proceed. Go back to Step 3 to fix column mappings.
            </p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warnings</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
            <p className="text-sm text-yellow-600 mt-2 italic">
              All rows will be imported, including those with missing required fields. You can fix the data later in the system.
            </p>
          </div>
        )}

        {/* Row Errors Details */}
        {rowErrors.length > 0 && rowErrors.length <= 10 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Row-level Issues:</h4>
            <div className="space-y-2 text-sm">
              {rowErrors.map((error, index) => (
                <div key={index} className="text-gray-700">
                  <span className="font-medium">Row {error.row}:</span> {error.errors.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Preview */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-medium text-gray-800">
              Data Preview {showAllPreviewRows ? `(All ${mappedData.length} rows)` : `(Page ${previewCurrentPage})`}
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAllPreviewRows(!showAllPreviewRows)}
                className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-medium transition-colors"
              >
                {showAllPreviewRows ? 'Show Paginated' : 'Show All'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto" style={{maxHeight: showAllPreviewRows ? '600px' : 'none', overflowY: showAllPreviewRows ? 'auto' : 'visible'}}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                  {Object.values(columnMapping).map((fieldValue, index) => {
                    const field = availableFields.find(f => f.value === fieldValue);
                    return (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field?.label || fieldValue}
                        {field?.required && <span className="text-red-500 ml-1">*</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showAllPreviewRows ? mappedData : mappedData.slice((previewCurrentPage - 1) * rowsPerPage, previewCurrentPage * rowsPerPage)).map((row, index) => {
                  const actualRowIndex = showAllPreviewRows ? index : (previewCurrentPage - 1) * rowsPerPage + index;
                  return (
                    <tr key={actualRowIndex} className={rowErrors.some(e => e.row === actualRowIndex + 2) ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 text-sm text-gray-900">{actualRowIndex + 2}</td>
                      {Object.values(columnMapping).map((fieldValue, fieldIndex) => (
                        <td key={fieldIndex} className="px-4 py-2 text-sm text-gray-900">
                          {row[fieldValue] || <span className="text-gray-400 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!showAllPreviewRows && mappedData.length > rowsPerPage && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((previewCurrentPage - 1) * rowsPerPage) + 1} to {Math.min(previewCurrentPage * rowsPerPage, mappedData.length)} of {mappedData.length} rows
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewCurrentPage(Math.max(1, previewCurrentPage - 1))}
                  disabled={previewCurrentPage === 1}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded font-medium transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {previewCurrentPage} of {Math.ceil(mappedData.length / rowsPerPage)}
                </span>
                <button
                  onClick={() => setPreviewCurrentPage(Math.min(Math.ceil(mappedData.length / rowsPerPage), previewCurrentPage + 1))}
                  disabled={previewCurrentPage === Math.ceil(mappedData.length / rowsPerPage)}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {showAllPreviewRows && mappedData.length > 20 && (
            <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center border-t border-gray-200">
              Showing all {mappedData.length} rows (scroll to see more)
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(3)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Previous: Fix Mappings
          </button>
          <button
            onClick={() => setCurrentStep(5)}
            disabled={!canProceed}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              canProceed
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 cursor-not-allowed text-gray-500'
            }`}
          >
            {canProceed ? '✅ Import Data' : '❌ Fix Errors First'}
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
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderImportResults();
      default:
        return renderStep1();
    }
  };

  const renderStep5 = () => {
    if (!csvData || !importType) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Please complete the previous steps first.</p>
        </div>
      );
    }

    // Perform the import
    const handleImport = async () => {
      if (!csvData || !importType) return;

      setIsImporting(true);
      setError(null);

      try {
        // Create mapped data for import
        const mappedData = csvData.rows.map((row) => {
          const mappedRow: any = {};
          csvData.headers.forEach((header, headerIndex) => {
            const dbField = columnMapping[header];
            if (dbField) {
              mappedRow[dbField] = row[headerIndex] || '';
            }
          });
          return mappedRow;
        });

        // Import ALL data - don't filter out rows with missing required fields
        const validImportType = importType as 'clients' | 'projects' | 'jobs';
        const requiredFields = DATABASE_FIELDS[validImportType].filter(field => field.required);
        
        // Count how many rows have validation issues for logging
        const validRows = mappedData.filter(row => {
          return requiredFields.every(field => row[field.value] && row[field.value].toString().trim() !== '');
        }).length;
        
        const validData = mappedData; // Import ALL rows, including those with errors

        console.log(`Importing ALL ${validData.length} rows (${validRows} valid, ${mappedData.length - validRows} with errors that can be fixed later)`);

        // Make API call
        const response = await fetch(`${API_URL}/api/import/${importType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ data: validData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const results = await response.json();
        setImportResults(results);
        
        console.log('Import completed:', results);
        
        // Move to success state
        setCurrentStep(6);

      } catch (error) {
        console.error('Import error:', error);
        setError(error instanceof Error ? error.message : 'Import failed');
      } finally {
        setIsImporting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Import Data
          </h3>
          <p className="text-gray-600 mb-6">
            Ready to import your {importType} data. Click the button below to start the import process.
          </p>
        </div>

        {/* Import Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-medium text-blue-800 mb-4">Import Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Import Type:</span>
              <span className="ml-2 capitalize">{importType}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">File:</span>
              <span className="ml-2">{file?.name}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Total Rows:</span>
              <span className="ml-2">{csvData.rows.length}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Columns Mapped:</span>
              <span className="ml-2">{Object.keys(columnMapping).length}</span>
            </div>
          </div>
          
          {importType === 'jobs' && Object.values(columnMapping).includes('client_name') && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">
                ✨ <strong>Smart Import Enabled:</strong> Clients and projects will be automatically created if they don't exist.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className="flex justify-center">
          <button
            onClick={handleImport}
            disabled={isImporting}
            className={`px-8 py-4 rounded-lg font-medium text-lg transition-all ${
              isImporting
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
            }`}
          >
            {isImporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Importing...
              </div>
            ) : (
              '🚀 Start Import'
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(4)}
            disabled={isImporting}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Previous: Review Data
          </button>
          <div></div> {/* Spacer */}
        </div>
      </div>
    );
  };

  const renderImportResults = () => {
    if (!importResults) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No import results available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Import Completed Successfully!
          </h3>
          <p className="text-gray-600">
            Your {importType} data has been imported into the system.
          </p>
        </div>

        {/* Results Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="font-medium text-green-800 mb-4">Import Results</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {importResults.created && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResults.created}</div>
                <div className="text-sm text-green-700">Created</div>
              </div>
            )}
            {importResults.clientsCreated && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResults.clientsCreated}</div>
                <div className="text-sm text-blue-700">Clients Created</div>
              </div>
            )}
            {importResults.projectsCreated && (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{importResults.projectsCreated}</div>
                <div className="text-sm text-purple-700">Projects Created</div>
              </div>
            )}
            {importResults.errors && importResults.errors.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            )}
          </div>
        </div>

        {/* Error Details */}
        {importResults.errors && importResults.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="font-medium text-red-800 mb-4">Import Errors</h4>
            <div className="space-y-2">
              {importResults.errors.map((error: string, index: number) => (
                <div key={index} className="text-sm text-red-700">
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Smart Import Details */}
        {(importResults.clientsCreated || importResults.projectsCreated) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-medium text-blue-800 mb-4">✨ Smart Import Summary</h4>
            <div className="text-sm text-blue-700 space-y-2">
              {importResults.clientsCreated && (
                <p>• Created {importResults.clientsCreated} new clients that didn't exist</p>
              )}
              {importResults.projectsCreated && (
                <p>• Created {importResults.projectsCreated} new projects that didn't exist</p>
              )}
              <p>• All data has been properly linked and organized in your system</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              // Reset for new import
              setCurrentStep(1);
              setImportType(null);
              setFile(null);
              setCsvData(null);
              setColumnMapping({});
              setError(null);
              setImportResults(null);
              // Reset pagination state
              setPreviewCurrentPage(1);
              setShowAllPreviewRows(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Import Another File
          </button>
          <button
            onClick={() => {
              // Close the import modal or navigate away
              window.location.reload(); // Simple way to refresh and see new data
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Imported Data
          </button>
        </div>
      </div>
    );
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