import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Holiday {
  id: number;
  name: string;
  date: string;
  isPublic: boolean;
  isCustom: boolean;
}

interface NewHoliday {
  name: string;
  date: string;
  isPublic: boolean;
  isCustom: boolean;
}

const HolidaysManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [newHoliday, setNewHoliday] = useState<NewHoliday>({
    name: '',
    date: '',
    isPublic: false,
    isCustom: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/holidays/year/${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }
      
      const data = await response.json();
      setHolidays(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHoliday)
      });

      if (!response.ok) {
        throw new Error('Failed to add holiday');
      }

      await fetchHolidays();
      setNewHoliday({ name: '', date: '', isPublic: false, isCustom: true });
      setIsAddingHoliday(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add holiday');
    }
  };

  const handleUpdateHoliday = async () => {
    if (!editingHoliday) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/holidays/${editingHoliday.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingHoliday.name,
          date: editingHoliday.date,
          isPublic: editingHoliday.isPublic,
          isCustom: editingHoliday.isCustom
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update holiday');
      }

      await fetchHolidays();
      setEditingHoliday(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update holiday');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/holidays/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete holiday');
      }

      await fetchHolidays();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete holiday');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sortedHolidays = holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="calendar" size={24} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Holidays Management</h2>
        </div>
        <button
          onClick={() => setIsAddingHoliday(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Icon name="plus" size={16} className="text-white" />
          Add Holiday
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Year Selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
          Year:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Add Holiday Form */}
      {isAddingHoliday && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Holiday</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holiday Name
              </label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Company Day Off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newHoliday.isPublic}
                onChange={(e) => setNewHoliday({ ...newHoliday, isPublic: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Public Holiday</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setIsAddingHoliday(false);
                setNewHoliday({ name: '', date: '', isPublic: false, isCustom: true });
                setError(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddHoliday}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Icon name="check" size={16} className="text-white" />
              Add Holiday
            </button>
          </div>
        </div>
      )}

      {/* Holidays List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading holidays...</p>
          </div>
        ) : sortedHolidays.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Icon name="calendar" size={48} className="text-gray-300 mx-auto mb-4" />
            <p>No holidays found for {selectedYear}</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holiday Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedHolidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingHoliday?.id === holiday.id ? (
                        <input
                          type="text"
                          value={editingHoliday.name}
                          onChange={(e) => setEditingHoliday({ ...editingHoliday, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingHoliday?.id === holiday.id ? (
                        <input
                          type="date"
                          value={editingHoliday.date}
                          onChange={(e) => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{formatDate(holiday.date)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingHoliday?.id === holiday.id ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingHoliday.isPublic}
                            onChange={(e) => setEditingHoliday({ ...editingHoliday, isPublic: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Public</span>
                        </label>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          holiday.isPublic 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {holiday.isPublic ? 'Public Holiday' : 'Custom Holiday'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingHoliday?.id === holiday.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleUpdateHoliday}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Icon name="check" size={16} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => setEditingHoliday(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Icon name="x" size={16} className="text-gray-400" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingHoliday(holiday)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Icon name="edit" size={16} className="text-blue-600" />
                          </button>
                          {holiday.isCustom && (
                            <button
                              onClick={() => handleDeleteHoliday(holiday.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Icon name="trash" size={16} className="text-red-600" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Public holidays are pre-defined Australian holidays for Gold Coast, Queensland. 
          Custom holidays can be added, edited, or deleted as needed for your organization.
        </p>
      </div>
    </div>
  );
};

export default HolidaysManagement;
