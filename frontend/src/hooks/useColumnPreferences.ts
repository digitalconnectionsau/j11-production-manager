import { useState, useEffect } from 'react';
import { apiRequest, API_ENDPOINTS } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export interface ColumnPreference {
  id?: number;
  columnName: string;
  isVisible: boolean;
  widthPx?: number;
  orderIndex: number;
}

export interface UseColumnPreferencesReturn {
  preferences: ColumnPreference[];
  loading: boolean;
  error: string | null;
  updatePreferences: (preferences: ColumnPreference[]) => Promise<void>;
  updateSinglePreference: (columnName: string, updates: Partial<ColumnPreference>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  getColumnVisibility: (columnName: string) => boolean;
  getColumnWidth: (columnName: string) => number | undefined;
  getColumnOrder: () => string[];
}

export function useColumnPreferences(tableName: string): UseColumnPreferencesReturn {
  const [preferences, setPreferences] = useState<ColumnPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [tableName]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`${API_ENDPOINTS.userColumnPreferences}/${tableName}`, {}, token || '');
      setPreferences(response.data);
    } catch (err: any) {
      console.error('Error loading column preferences:', err);
      setError(err.message || 'Failed to load column preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: ColumnPreference[]) => {
    try {
      setError(null);
      
      await apiRequest(`${API_ENDPOINTS.userColumnPreferences}/${tableName}`, {
        method: 'PUT',
        body: JSON.stringify({ preferences: newPreferences })
      }, token || '');
      
      setPreferences(newPreferences);
    } catch (err: any) {
      console.error('Error updating column preferences:', err);
      setError(err.message || 'Failed to update column preferences');
      throw err;
    }
  };

  const updateSinglePreference = async (columnName: string, updates: Partial<ColumnPreference>) => {
    try {
      setError(null);
      
      await apiRequest(`${API_ENDPOINTS.userColumnPreferences}/${tableName}/${columnName}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }, token || '');
      
      // Update local state
      setPreferences(prev => {
        const existing = prev.find(p => p.columnName === columnName);
        if (existing) {
          return prev.map(p => 
            p.columnName === columnName 
              ? { ...p, ...updates }
              : p
          );
        } else {
          return [...prev, {
            columnName,
            isVisible: true,
            orderIndex: prev.length,
            ...updates
          }];
        }
      });
    } catch (err: any) {
      console.error('Error updating column preference:', err);
      setError(err.response?.data?.error || 'Failed to update column preference');
      throw err;
    }
  };

  const resetPreferences = async () => {
    try {
      setError(null);
      
      await apiRequest(`${API_ENDPOINTS.userColumnPreferences}/${tableName}`, {
        method: 'DELETE'
      }, token || '');
      
      setPreferences([]);
      await loadPreferences(); // Reload to get defaults
    } catch (err: any) {
      console.error('Error resetting column preferences:', err);
      setError(err.message || 'Failed to reset column preferences');
      throw err;
    }
  };

  const getColumnVisibility = (columnName: string): boolean => {
    const pref = preferences.find(p => p.columnName === columnName);
    return pref?.isVisible ?? true; // Default to visible if no preference
  };

  const getColumnWidth = (columnName: string): number | undefined => {
    const pref = preferences.find(p => p.columnName === columnName);
    return pref?.widthPx;
  };

  const getColumnOrder = (): string[] => {
    if (!Array.isArray(preferences) || preferences.length === 0) {
      // Return empty array to let the component use its default order
      return [];
    }
    // Sort preferences by orderIndex and return column names
    return preferences
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(p => p.columnName);
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    updateSinglePreference,
    resetPreferences,
    getColumnVisibility,
    getColumnWidth,
    getColumnOrder,
  };
}