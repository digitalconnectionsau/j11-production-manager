import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

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
    { 
      id: 'Dashboard',
      name: 'Dashboard', 
      icon: 'dashboard',
      href: '/' 
    },
    { 
      id: 'Jobs',
      name: 'Jobs', 
      icon: 'jobs',
      href: '/jobs' 
    },
    { 
      id: 'Projects',
      name: 'Projects', 
      icon: 'projects',
      href: '/projects' 
    },
    { 
      id: 'Clients',
      name: 'Clients', 
      icon: 'clients',
      href: '/clients' 
    },
    { 
      id: 'Reports',
      name: 'Reports', 
      icon: 'reports',
      href: '/reports' 
    },
    { 
      id: 'Settings',
      name: 'Settings', 
      icon: 'settings',
      href: '/settings' 
    },
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
    if (token) {
      fetchPinnedProjects();
    }
  }, [token]);

  useEffect(() => {
    // Refresh pinned projects when navigating to Projects page
    if (currentPage === 'Projects' && token) {
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
    <div className="fixed left-0 top-0 w-64 bg-black text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-light-grey border-opacity-20">
        <div className="flex items-center space-x-3">
          <img 
            src="/favicon.svg" 
            alt="J11 Logo" 
            width="40" 
            height="40" 
            className="flex-shrink-0"
          />
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Joinery Eleven</h1>
            <p className="text-gray-300 text-sm -mt-0.8">Production Manager</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-light-grey border-opacity-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-sm font-semibold text-white">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-300 capitalize">{user?.role || 'User'}</p>
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
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:bg-primary hover:bg-opacity-80 hover:text-white'
                }`}
              >
                <span className="w-6 h-6 flex items-center justify-center text-lg">
                  <Icon name={item.icon} size={24} />
                </span>
                <span className="font-medium">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Pinned Projects Section */}
        {pinnedProjects.length > 0 && (
          <div className="mt-6 px-4">
            <div className="border-t border-light-grey border-opacity-20 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 px-2">Pinned Projects</h3>
              <ul className="space-y-1">
                {pinnedProjects.map((pinnedProject) => (
                  <li key={pinnedProject.id}>
                    <button
                      onClick={() => handlePinnedProjectClick(pinnedProject.projectId)}
                      className="w-full text-left px-2 py-2 text-sm text-gray-300 hover:bg-primary hover:bg-opacity-80 hover:text-white rounded transition-all duration-200 flex items-center space-x-2 min-w-0"
                    >
                      <Icon name="pin" size={12} />
                      <span className="truncate font-medium">
                        {pinnedProject.project.name}
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
            <div className="border-t border-light-grey border-opacity-20 pt-4">
              <div className="text-sm text-gray-300 flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading pinned projects...</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-light-grey border-opacity-20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-6 py-3 text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
        >
          <Icon name="logout" size={24} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
