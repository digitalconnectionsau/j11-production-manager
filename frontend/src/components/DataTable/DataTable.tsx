import { useState, useMemo } from 'react';
import type { TableProps, TableColumn, SortConfig } from './types';
import ResizableColumnHeader from '../ResizableColumnHeader';
import ColumnManager from '../ColumnManager';
import LoadingSpinner from '../ui/LoadingSpinner';

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  filters = [],
  onFiltersChange,
  defaultSort,
  onSortChange,
  onRowClick,
  onRowSelect,
  selectable = false,
  columnPreferences = [],
  onColumnPreferencesChange,
  resizableColumns = true,
  className = '',
  striped = true,
  bordered = true,
  emptyMessage = 'No data found',
  emptySubMessage = 'Try adjusting your filters or search terms',
  pagination
}: TableProps<T>) {
  // Internal state for sorting and filtering if not externally controlled
  const [internalSort, setInternalSort] = useState<SortConfig>(
    defaultSort || { field: '', direction: 'asc' }
  );
  const [internalFilters, setInternalFilters] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Use internal or external sort state
  const currentSort = onSortChange ? (defaultSort || internalSort) : internalSort;
  const currentFilters = onFiltersChange ? {} : internalFilters;

  // Handle sorting
  const handleSort = (field: string) => {
    const newDirection: 'asc' | 'desc' = 
      currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
    const newSort: SortConfig = { field, direction: newDirection };
    
    if (onSortChange) {
      onSortChange(newSort);
    } else {
      setInternalSort(newSort);
    }
  };

  // Handle filtering
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...currentFilters, [key]: value };
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
  };

  // Apply filters and sorting to data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply filters
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return;
      
      filtered = filtered.filter((item) => {
        const itemValue = item[key];
        
        if (typeof value === 'string') {
          return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
        }
        
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        
        return itemValue === value;
      });
    });

    // Apply sorting
    if (currentSort.field) {
      filtered.sort((a, b) => {
        const aValue = a[currentSort.field];
        const bValue = b[currentSort.field];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return currentSort.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [data, currentFilters, currentSort]);

  // Get visible columns based on preferences
  const visibleColumns = useMemo(() => {
    if (columnPreferences.length === 0) return columns;
    
    // Sort columns by preference order and filter visible ones
    return columnPreferences
      .filter(pref => pref.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(pref => columns.find(col => col.key === pref.key))
      .filter(Boolean) as TableColumn<T>[];
  }, [columns, columnPreferences]);

  // Handle row selection
  const handleRowSelect = (_row: T, index: number) => {
    const newSelected = new Set(selectedRows);
    
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    
    setSelectedRows(newSelected);
    
    if (onRowSelect) {
      const selectedData = Array.from(newSelected).map(idx => processedData[idx]);
      onRowSelect(selectedData);
    }
  };

  // Render sort icon
  const SortIcon = ({ field }: { field: string }) => {
    if (currentSort.field !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return (
      <span className="text-blue-600">
        {currentSort.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Render filter controls
  const renderFilters = () => {
    if (filters.length === 0) return null;
    
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filter.label}
              </label>
              {filter.type === 'text' && (
                <input
                  type="text"
                  value={currentFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              {filter.type === 'select' && (
                <select
                  value={currentFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {filter.type === 'date' && (
                <input
                  type="date"
                  value={currentFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              {filter.type === 'checkbox' && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={currentFilters[filter.key] || false}
                    onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{filter.placeholder}</span>
                </label>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <LoadingSpinner size="md" color="blue" className="mx-auto" />
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      {renderFilters()}

      {/* Table Controls */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {processedData.length} of {data.length} items
        </div>
        <div className="flex space-x-2">
          {onColumnPreferencesChange && (
            <button
              onClick={() => setShowColumnManager(true)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Manage Columns
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`bg-white rounded-lg overflow-hidden ${bordered ? 'border border-gray-200' : ''}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectable && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === processedData.length && processedData.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(processedData.map((_, index) => index)));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {visibleColumns.map((column) => {
                  const preference = columnPreferences.find(p => p.key === column.key);
                  const width = preference?.widthPx || column.width;
                  
                  if (resizableColumns && onColumnPreferencesChange) {
                    return (
                      <ResizableColumnHeader
                        key={column.key}
                        width={width}
                        onResize={(newWidth) => {
                          const newPrefs = [...columnPreferences];
                          const existingIndex = newPrefs.findIndex(p => p.key === column.key);
                          
                          if (existingIndex >= 0) {
                            newPrefs[existingIndex] = { ...newPrefs[existingIndex], widthPx: newWidth };
                          } else {
                            newPrefs.push({ key: column.key, widthPx: newWidth, visible: true });
                          }
                          
                          onColumnPreferencesChange(newPrefs);
                        }}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''}`}
                      >
                        <div 
                          className={`flex items-center space-x-1 ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          onClick={() => column.sortable && handleSort(column.key)}
                        >
                          <span>{column.label}</span>
                          {column.sortable && <SortIcon field={column.key} />}
                        </div>
                      </ResizableColumnHeader>
                    );
                  }
                  
                  return (
                    <th
                      key={column.key}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''}`}
                      style={{ width: width ? `${width}px` : undefined }}
                    >
                      <div 
                        className={`flex items-center space-x-1 ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <span>{column.label}</span>
                        {column.sortable && <SortIcon field={column.key} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y divide-gray-200' : ''}`}>
              {processedData.map((row, index) => (
                <tr 
                  key={index}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                    ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}
                    ${selectedRows.has(index) ? 'bg-blue-100' : ''}
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(row, index);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {visibleColumns.map((column) => (
                    <td
                      key={`${index}-${column.key}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || 'text-gray-900'}`}
                      style={column.cellStyle ? column.cellStyle(row) : undefined}
                    >
                      {column.render ? column.render(row[column.key], row) : (row[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {processedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{emptyMessage}</p>
            {emptySubMessage && (
              <p className="text-gray-400 text-sm mt-1">{emptySubMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Column Manager Modal */}
      {onColumnPreferencesChange && (
        <ColumnManager
          columns={columns.map(col => col.key)}
          preferences={columnPreferences}
          onUpdatePreferences={onColumnPreferencesChange}
          onReset={() => onColumnPreferencesChange([])}
          isOpen={showColumnManager}
          onClose={() => setShowColumnManager(false)}
        />
      )}
    </div>
  );
}

export default DataTable;