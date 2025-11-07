import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, API_ENDPOINTS, setUnauthorizedCallback, clearUnauthorizedCallback } from '../utils/api';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Inactivity timeout configuration (30 minutes)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setLastActivity(Date.now()); // Initialize activity timestamp
    }
    setLoading(false);
  }, []);

  // Track user activity
  useEffect(() => {
    if (!token) return; // Only track activity when logged in

    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Listen to user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [token]);

  // Check for inactivity and auto-logout
  useEffect(() => {
    if (!token || !user) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log('🔒 Auto-logout: User inactive for 30 minutes');
        logout();
        // Optionally show a notification
        alert('You have been logged out due to inactivity.');
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [token, user, lastActivity]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await apiRequest(API_ENDPOINTS.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(response.data.token);
      setUser(response.data.user);
      
      // Store in localStorage
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    // Clear the unauthorized callback when logging out
    clearUnauthorizedCallback();
  };

  // Register the unauthorized callback when component mounts
  useEffect(() => {
    // Set up global handler for unauthorized responses
    setUnauthorizedCallback(() => {
      console.log('🔒 Unauthorized response detected - logging out...');
      logout();
      // Force reload to ensure clean state and redirect to login
      window.location.href = '/';
    });

    return () => {
      clearUnauthorizedCallback();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
