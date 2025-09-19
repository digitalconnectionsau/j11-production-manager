import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to handle authentication redirects and error messaging
 */
export const useAuthGuard = () => {
  const { user, token, loading } = useAuth();

  // Check if user is authenticated
  const isAuthenticated = !loading && user && token;
  
  // Check if we're still loading authentication state
  const isLoading = loading;

  // Redirect to login with a message if not authenticated
  const requireAuth = (onUnauthorized?: () => void) => {
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        if (onUnauthorized) {
          onUnauthorized();
        }
      }
    }, [loading, isAuthenticated, onUnauthorized]);
  };

  return {
    isAuthenticated,
    isLoading,
    requireAuth,
    user,
    token
  };
};

/**
 * Hook for handling API errors with better UX
 */
export const useApiErrorHandler = () => {
  const { logout } = useAuth();

  const handleApiError = (error: any, response?: Response) => {
    // Handle authentication errors
    if (response?.status === 401) {
      console.warn('Authentication expired, logging out...');
      logout();
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        action: 'redirect'
      };
    }

    // Handle forbidden errors
    if (response?.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        action: 'show'
      };
    }

    // Handle server errors
    if (response?.status && response.status >= 500) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: 'show'
      };
    }

    // Handle network errors
    if (!response || error?.name === 'TypeError') {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        action: 'show'
      };
    }

    // Default error handling
    return {
      title: 'Error',
      message: error?.message || 'An unexpected error occurred.',
      action: 'show'
    };
  };

  return { handleApiError };
};