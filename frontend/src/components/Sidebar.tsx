import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'Clients', label: 'Clients', icon: '👥' },
    { id: 'Projects', label: 'Projects', icon: '📁' },
    { id: 'Reports', label: 'Reports', icon: '📈' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fixed left-0 top-0 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold">Joinery Eleven</h1>
        <p className="text-blue-200 text-sm">Production Manager</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-blue-200">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200"
        >
          <span className="text-lg">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
