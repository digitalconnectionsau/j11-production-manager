import { useState } from 'react';

/**
 * Centralized API configuration and utilities
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Auth
  login: '/api/auth/login',
  register: '/api/auth/register',
  forgotPassword: '/api/auth/forgot-password',
  resetPassword: '/api/auth/reset-password',
  
  // Core entities
  jobs: '/api/jobs',
  projects: '/api/projects',
  clients: '/api/clients',
  contacts: '/api/contacts',
  
  // Status and settings
  jobStatuses: '/api/job-statuses',
  leadTimes: '/api/lead-times',
  holidays: '/api/holidays',
  pinned: '/api/pinned',
  roles: '/api/roles',
  users: '/api/users',
  
  // Analytics
  analytics: '/api/analytics/analytics',
  
  // User preferences
  userColumnPreferences: '/api/user-column-preferences'
};

/**
 * Create standard headers with authentication
 */
export const createAuthHeaders = (token: string): Record<string, string> => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

/**
 * API Response interface
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status: number;
}

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  status: number;
  response?: Response;
  
  constructor(message: string, status: number, response?: Response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Enhanced fetch wrapper with authentication and error handling
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? createAuthHeaders(token) : {}),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    
    // Try to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Return structured error response
      return {
        success: false,
        status: response.status,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      status: response.status,
      data
    };

  } catch (error) {
    // Network or other errors
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, token?: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }, token),
    
  post: <T = any>(endpoint: string, data?: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, token),
    
  put: <T = any>(endpoint: string, data?: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, token),
    
  patch: <T = any>(endpoint: string, data?: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }, token),
    
  delete: <T = any>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }, token)
};

/**
 * Hook for API calls with loading states
 */
export const createApiHook = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async <T>(
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      
      if (!response.success) {
        setError(response.error || 'An error occurred');
        return null;
      }
      
      return response.data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, execute };
};