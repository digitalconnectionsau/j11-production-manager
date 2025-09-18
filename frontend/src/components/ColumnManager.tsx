import React, { useState } from 'react';
import type { ColumnPreference } from '../hooks/useColumnPreferences';

interface ColumnManagerProps {
  columns: string[];
  preferences: ColumnPreference[];
  onUpdatePreferences: (preferences: ColumnPreference[]) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns,
  preferences,
  onUpdatePreferences,
  onReset,
  isOpen,
  onClose,
}) => {
  const [localPreferences, setLocalPreferences] = useState<ColumnPreference[]>(preferences);

  // Create preferences for columns that don't have them
  React.useEffect(() => {
    const prefsMap = new Map(preferences.map(p => [p.columnName, p]));
    const allPrefs = columns.map((col, index) => {
      const existing = prefsMap.get(col);
      return existing || {
        columnName: col,
        isVisible: true,
        orderIndex: index,
      };
    });
    setLocalPreferences(allPrefs);
  }, [columns, preferences]);

  const toggleColumnVisibility = (columnName: string) => {
    setLocalPreferences(prev =>
      prev.map(p =>
        p.columnName === columnName
          ? { ...p, isVisible: !p.isVisible }
          : p
      )
    );
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newPrefs = [...localPreferences];
    const [movedItem] = newPrefs.splice(fromIndex, 1);
    newPrefs.splice(toIndex, 0, movedItem);

    // Update order indices
    const updatedPrefs = newPrefs.map((pref, index) => ({
      ...pref,
      orderIndex: index,
    }));

    setLocalPreferences(updatedPrefs);
  };

  const handleSave = () => {
    onUpdatePreferences(localPreferences);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Manage Columns</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Drag columns to reorder, toggle visibility with the eye icon.
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {localPreferences.map((pref, index) => (
            <div
              key={pref.columnName}
              className="flex items-center p-3 bg-gray-50 rounded-lg border"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', index.toString());
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                if (fromIndex !== index) {
                  moveColumn(fromIndex, index);
                }
              }}
            >
              <div className="flex-1 flex items-center space-x-3">
                <div className="cursor-move text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900 capitalize">
                  {pref.columnName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <button
                onClick={() => toggleColumnVisibility(pref.columnName)}
                className={`p-1 rounded ${
                  pref.isVisible
                    ? 'text-blue-600 hover:text-blue-800'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {pref.isVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Reset to Default
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnManager;