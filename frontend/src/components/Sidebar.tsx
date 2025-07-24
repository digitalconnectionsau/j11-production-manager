import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PinnedProject {
  id: number;
  projectId: number;
  order: number;
  createdAt: string;
  project: {
    id: number;
    name: string;
    status: string;
  };
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onProjectSelect?: (projectId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, onProjectSelect }) => {
  const { logout, user, token } = useAuth();
  const [pinnedProjects, setPinnedProjects] = useState<PinnedProject[]>([]);
  const [loadingPinned, setLoadingPinned] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'Clients', label: 'Clients', icon: '👥' },
    { id: 'Projects', label: 'Projects', icon: '📁' },
    { id: 'Reports', label: 'Reports', icon: '📈' },
    { id: 'Settings', label: 'Settings', icon: '⚙️' },
  ];

  // Fetch pinned projects
  const fetchPinnedProjects = async () => {
    if (!token) return;
    
    try {
      setLoadingPinned(true);
      const response = await fetch(`${API_URL}/api/pinned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPinnedProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch pinned projects:', err);
    } finally {
      setLoadingPinned(false);
    }
  };

  useEffect(() => {
    fetchPinnedProjects();
  }, [token]);

  useEffect(() => {
    // Refresh pinned projects when navigating to Projects page
    if (currentPage === 'Projects') {
      fetchPinnedProjects();
    }
  }, [currentPage]);

  const handleLogout = () => {
    logout();
  };

  const handlePinnedProjectClick = (projectId: number) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    } else {
      // Fallback: navigate to Projects page and then select the project
      onPageChange('Projects');
    }
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
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200 ${
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

        {/* Pinned Projects Section */}
        {pinnedProjects.length > 0 && (
          <div className="mt-6 px-4">
            <div className="border-t border-blue-700 pt-4">
              <h3 className="text-sm font-semibold text-blue-200 mb-3 px-2">Pinned Projects</h3>
              <ul className="space-y-1">
                {pinnedProjects.map((pinnedProject) => (
                  <li key={pinnedProject.id}>
                    <button
                      onClick={() => handlePinnedProjectClick(pinnedProject.projectId)}
                      className="w-full text-left px-2 py-2 text-sm text-blue-100 hover:bg-blue-800 hover:text-white rounded transition-all duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-xs">📌</span>
                        <span className="truncate font-medium">
                          {pinnedProject.project.name}
                        </span>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        pinnedProject.project.status === 'completed' 
                          ? 'bg-green-500/20 text-green-200' 
                          : pinnedProject.project.status === 'in-progress'
                          ? 'bg-blue-500/20 text-blue-200'
                          : 'bg-yellow-500/20 text-yellow-200'
                      }`}>
                        {pinnedProject.project.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {loadingPinned && (
          <div className="mt-6 px-6">
            <div className="border-t border-blue-700 pt-4">
              <div className="text-sm text-blue-200 flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading pinned projects...</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-6 py-3 text-blue-100 hover:bg-red-600 hover:text-white transition-all duration-200"
        >
          <span className="text-lg">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
