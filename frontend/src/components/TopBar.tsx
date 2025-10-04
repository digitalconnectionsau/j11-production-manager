import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

interface TopBarProps {
  sidebarCollapsed: boolean;
  onPageChange: (page: string) => void;
  onSettingsNavigation?: (tab: 'holidays' | 'job-status' | 'lead-times' | 'import' | 'company' | 'system' | 'users' | 'archived-clients', openProfile?: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ sidebarCollapsed, onPageChange, onSettingsNavigation }) => {
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
    <div className="fixed top-0 right-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end z-40" 
         style={{ 
           height: '60px',
           left: sidebarCollapsed ? '64px' : '256px', // Account for sidebar width
           transition: 'left 300ms'
         }}>
      {/* Right side - Notifications and User Menu */}
      <div className="flex items-center space-x-4">
        {/* Bell/Alerts Icon */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleUserMenu();
            }}
            className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                <div className="font-medium">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.name || user?.username || user?.email}
                </div>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onSettingsNavigation) {
                    onSettingsNavigation('users', true);
                  } else {
                    onPageChange('Settings');
                  }
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon name="settings" size={16} className="mr-2" />
                Account
              </button>
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
    </div>
  );
};

export default TopBar;