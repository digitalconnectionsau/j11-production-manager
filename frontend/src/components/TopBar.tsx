import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

interface TopBarProps {
  sidebarCollapsed: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  return (
    <div className="fixed top-0 right-0 bg-charcoal border-b border-light-grey border-opacity-20 px-6 py-3 flex items-center justify-end z-40" 
         style={{ 
           height: '60px',
           left: sidebarCollapsed ? '64px' : '256px', // Account for sidebar width
           transition: 'left 300ms'
         }}>
      {/* Right side - User Menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleUserMenu();
          }}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-light-grey bg-opacity-10 hover:bg-opacity-20 rounded-lg px-3 py-2"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block font-medium">{user?.username || 'User'}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
              <div className="font-medium">{user?.username}</div>
              <div className="text-gray-500">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Icon name="logout" size={16} className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;