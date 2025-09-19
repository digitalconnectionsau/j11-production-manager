import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, type ApiResponse } from '../utils/api';
import { useApiErrorHandler } from './useAuth';

interface UseApiCallOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for making API calls with loading states and error handling
 */
export const useApiCall = <T = any>(
  endpoint: string,
  options: UseApiCallOptions = {}
) => {
  const { immediate = true, onSuccess, onError } = options;
  const { token, logout } = useAuth();
  const { handleApiError } = useApiErrorHandler();
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    if (!token) {
      const errorMsg = 'Authentication required';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<T>(endpoint, token);
      
      if (response.success && response.data) {
        setData(response.data);
        if (onSuccess) onSuccess(response.data);
        return response.data;
      } else {
        const errorInfo = handleApiError(new Error(response.error), 
          { status: response.status } as Response);
        
        if (errorInfo.action === 'redirect') {
          logout();
        }
        
        setError(errorInfo.message);
        if (onError) onError(errorInfo.message);
        return null;
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      if (onError) onError(errorInfo.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, token, onSuccess, onError, handleApiError, logout]);

  const refetch = useCallback(() => execute(), [execute]);

  useEffect(() => {
    if (immediate && token) {
      execute();
    }
  }, [immediate, token, execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    setData,
    setError
  };
};

/**
 * Hook for making POST requests
 */
export const useApiPost = <T = any>(endpoint: string) => {
  const { token } = useAuth();
  const { handleApiError } = useApiErrorHandler();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: any): Promise<ApiResponse<T>> => {
    if (!token) {
      const errorMsg = 'Authentication required';
      setError(errorMsg);
      return {
        success: false,
        status: 401,
        error: errorMsg
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<T>(endpoint, data, token);
      
      if (!response.success) {
        const errorInfo = handleApiError(new Error(response.error), 
          { status: response.status } as Response);
        setError(errorInfo.message);
      }
      
      return response;
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      return {
        success: false,
        status: 0,
        error: errorInfo.message
      };
    } finally {
      setLoading(false);
    }
  }, [endpoint, token, handleApiError]);

  return {
    loading,
    error,
    execute,
    setError
  };
};