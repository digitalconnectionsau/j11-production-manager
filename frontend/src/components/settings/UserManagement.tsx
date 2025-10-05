import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/api';

interface User {
  id: number;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  isBlocked: boolean;
  lastLogin?: string;
  createdAt: string;
  roles: {
    roleId: number;
    roleName: string;
    roleDisplayName: string;
  }[];
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  isSuperAdmin: boolean;
}

interface UserManagementProps {
  openProfileEdit?: boolean;
  onProfileEditClose?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ openProfileEdit = false, onProfileEditClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [hasUserManagementPermission, setHasUserManagementPermission] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const openProfileEditRef = useRef(openProfileEdit);

  // Form state for add/edit user
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    mobile: '',
    department: '',
    position: '',
    phone: '',
    isActive: true,
    isBlocked: false,
    roleIds: [] as number[],
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      password: '',
      mobile: '',
      department: '',
      position: '',
      phone: '',
      isActive: true,
      isBlocked: false,
      roleIds: [],
    });
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, departmentFilter]);

  // Update ref when prop changes
  useEffect(() => {
    openProfileEditRef.current = openProfileEdit;
  }, [openProfileEdit]);

  // Auto-open profile edit modal when requested
  useEffect(() => {
    if (openProfileEdit && currentUserProfile && !showProfileEdit) {
      // Add a small delay to ensure the component is fully rendered
      setTimeout(() => {
        handleEditProfile();
      }, 100);
    }
  }, [openProfileEdit, currentUserProfile, showProfileEdit, hasUserManagementPermission]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      try {
        // First try to fetch users from basic API (any authenticated user)
        const basicUsersResponse = await fetch(`${API_BASE_URL}/api/users/basic`, { headers });
        if (basicUsersResponse.ok) {
          const usersData = await basicUsersResponse.json();
          setUsers(usersData.users || []);
          setHasUserManagementPermission(true); // Allow basic user management for now

          // Always load current user profile for profile editing
          await loadCurrentUserProfile();

          // Try to fetch roles from API (might fail for non-admin users)
          try {
            const rolesResponse = await fetch(`${API_BASE_URL}/api/users/roles/list`, { headers });
            if (rolesResponse.ok) {
              const rolesData = await rolesResponse.json();
              setRoles(rolesData);
            }
          } catch (roleError) {
            // Roles not available for this user
          }
        } else {
          // If basic users fetch fails, fallback to current user profile
          setHasUserManagementPermission(false);
          await loadCurrentUserProfile();
        }
      } catch (error) {
        // If users fetch fails, fallback to current user profile
        setHasUserManagementPermission(false);
        await loadCurrentUserProfile();
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load user information' });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, { headers });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCurrentUserProfile(profileData);
        
        // Auto-open profile edit modal if requested
        if (openProfileEditRef.current) {
          setTimeout(() => {
            handleEditProfile();
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load your profile' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive && !user.isBlocked) ||
      (statusFilter === 'inactive' && !user.isActive) ||
      (statusFilter === 'blocked' && user.isBlocked);
    
    const matchesDepartment = !departmentFilter || user.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const uniqueDepartments = [...new Set(users.map(user => user.department).filter(Boolean))];

  const handleAddUser = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      username: user.username || '',
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      mobile: user.mobile || '',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      roleIds: user.roles.map(r => r.roleId),
    });
    setShowEditModal(true);
  };

  const handleBlockUser = async (user: User) => {
    if (confirm(`Are you sure you want to ${user.isBlocked ? 'unblock' : 'block'} ${user.firstName} ${user.lastName}?`)) {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setMessage({ type: 'error', text: 'Authentication required' });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/block`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isBlocked: !user.isBlocked
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user block status');
        }

        const result = await response.json();
        setMessage({ type: 'success', text: result.message });
        loadData();
      } catch (error) {
        console.error('Error updating user block status:', error);
        setMessage({ type: 'error', text: 'Failed to update user status' });
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}? This action can be undone.`)) {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setMessage({ type: 'error', text: 'Authentication required' });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to deactivate user');
        }

        setMessage({ type: 'success', text: 'User deactivated successfully' });
        loadData();
      } catch (error) {
        console.error('Error deactivating user:', error);
        setMessage({ type: 'error', text: 'Failed to deactivate user' });
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      const userData = {
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        department: formData.department,
        position: formData.position,
        phone: formData.phone,
        isActive: formData.isActive,
        isBlocked: formData.isBlocked,
        roleIds: formData.roleIds,
        ...(formData.password && { password: formData.password }), // Only include password if provided
      };

      let url, method;
      if (selectedUser) {
        // For updates, use the full API
        url = `${API_BASE_URL}/api/users/${selectedUser.id}`;
        method = 'PUT';
      } else {
        // For creating new users, use basic endpoint if no manage_users permission
        url = hasUserManagementPermission ? `${API_BASE_URL}/api/users` : `${API_BASE_URL}/api/users/basic`;
        method = 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }

      setMessage({ type: 'success', text: selectedUser ? 'User updated successfully' : 'User created successfully' });
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving user:', error);
      setMessage({ type: 'error', text: 'Failed to save user' });
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isBlocked) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>;
    }
    if (!user.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    return new Date(lastLogin).toLocaleDateString();
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        mobile: formData.mobile,
        department: formData.department,
        position: formData.position,
        phone: formData.phone,
      };

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      setCurrentUserProfile(result.user);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setShowProfileEdit(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    }
  };

  const handleEditProfile = () => {
    if (currentUserProfile) {
      setFormData({
        email: currentUserProfile.email || '',
        username: currentUserProfile.username || '',
        firstName: currentUserProfile.firstName || '',
        lastName: currentUserProfile.lastName || '',
        password: '',
        mobile: currentUserProfile.mobile || '',
        department: currentUserProfile.department || '',
        position: currentUserProfile.position || '',
        phone: currentUserProfile.phone || '',
        isActive: true,
        isBlocked: false,
        roleIds: [],
      });
      setShowProfileEdit(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {hasUserManagementPermission ? (
        // Full User Management Section
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage user accounts, roles, and permissions</p>
            </div>
            <button
              onClick={handleAddUser}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add User</span>
            </button>
          </div>
        </>
      ) : (
        // My Profile Section
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">My Profile</h3>
              <p className="text-sm text-gray-600">View and update your personal information</p>
            </div>
            {currentUserProfile && (
              <button
                onClick={handleEditProfile}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Display Section */}
      {!hasUserManagementPermission && currentUserProfile && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Personal Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">First Name</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.firstName || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Name</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.lastName || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Username</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.username || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mobile</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.mobile || 'Not set'}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Work Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.department || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.position || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-sm text-gray-900">{currentUserProfile.phone || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Filters - Only show if user has permission */}
      {hasUserManagementPermission && (
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      )}



      {/* Users Table - Only show if user has permission */}
      {hasUserManagementPermission && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department / Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.mobile && (
                        <div className="text-sm text-gray-500">{user.mobile}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.department || '-'}</div>
                    <div className="text-sm text-gray-500">{user.position || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role.roleId}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                        >
                          {role.roleDisplayName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastLogin(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleBlockUser(user)}
                        className={`${user.isBlocked ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}`}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                        disabled={!user.isActive}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Edit My Profile</h3>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileEdit(false);
                    if (onProfileEditClose) {
                      onProfileEditClose();
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md"
                  style={{ backgroundColor: '#FF661F' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55A1A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF661F'}
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal - Only show if user has permission */}
      {hasUserManagementPermission && (showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                {!selectedUser && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, roleIds: [...formData.roleIds, role.id] });
                          } else {
                            setFormData({ ...formData, roleIds: formData.roleIds.filter(id => id !== role.id) });
                          }
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{role.displayName}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500">{role.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {selectedUser && (
                <div className="mt-6 flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isBlocked}
                      onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Blocked</span>
                  </label>
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
                >
                  {selectedUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;