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
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, onProjectSelect, collapsed, onToggleCollapse }) => {
  const { token } = useAuth();
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

  const handlePinnedProjectClick = (projectId: number) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    } else {
      // Fallback: navigate to Projects page and then select the project
      onPageChange('Projects');
    }
  };

  return (
    <div className={`fixed left-0 top-0 bg-black text-white flex flex-col transition-all duration-300 z-50 ${
      collapsed ? 'w-16' : 'w-64'
    }`} style={{
      height: '100vh'
    }}>

      {/* Logo/Brand Header */}
      <div className={`${collapsed ? 'p-3' : 'p-4'}`} style={{ height: '60px' }}>
        {collapsed ? (
          <div className="flex items-center justify-center h-full">
            <img 
              src="/favicon.svg" 
              alt="J11 Logo" 
              width="28" 
              height="28" 
              className="flex-shrink-0"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-3">
              <img 
                src="/favicon.svg" 
                alt="J11 Logo" 
                width="28" 
                height="28" 
                className="flex-shrink-0"
              />
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Joinery Eleven</h1>
                <p className="text-gray-300 text-xs -mt-0.5">Production Manager</p>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="text-gray-300 hover:text-white transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Expand button for collapsed state */}
      {collapsed && (
        <div className="border-b border-light-grey border-opacity-20 p-3">
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="text-gray-300 hover:text-white transition-colors"
              title="Expand sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center transition-all duration-200 relative ${
                  collapsed ? 'justify-center px-3 py-3 mx-2' : 'space-x-3 py-3'
                } ${
                  currentPage === item.id
                    ? `bg-gray-200 text-gray-900 ${collapsed ? '' : 'border-l-4 border-orange-500 pl-5'}`
                    : `text-gray-300 hover:bg-gray-200 hover:text-gray-900 ${collapsed ? '' : 'hover:border-l-4 hover:border-orange-500 hover:pl-5'} ${collapsed ? '' : 'pl-6'}`
                }`}
                title={collapsed ? item.name : undefined}
              >
                <span className="w-6 h-6 flex items-center justify-center text-lg">
                  <Icon name={item.icon} size={24} />
                </span>
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </button>
            </li>
          ))}
        </ul>

        {/* Pinned Projects Section */}
        {!collapsed && pinnedProjects.length > 0 && (
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

        {!collapsed && loadingPinned && (
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
    </div>
  );
};

export default Sidebar;
