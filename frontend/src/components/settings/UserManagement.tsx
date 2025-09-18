import React, { useState, useEffect } from 'react';

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

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');

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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch users from API
      const usersResponse = await fetch('/api/users', { headers });
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Fetch roles from API
      const rolesResponse = await fetch('/api/users/roles/list', { headers });
      if (!rolesResponse.ok) {
        throw new Error('Failed to fetch roles');
      }
      const rolesData = await rolesResponse.json();
      setRoles(rolesData);

    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load users and roles' });
    } finally {
      setLoading(false);
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
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ type: 'error', text: 'Authentication required' });
          return;
        }

        const response = await fetch(`/api/users/${user.id}/block`, {
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
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ type: 'error', text: 'Authentication required' });
          return;
        }

        const response = await fetch(`/api/users/${user.id}`, {
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
      const token = localStorage.getItem('token');
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

      const url = selectedUser ? `/api/users/${selectedUser.id}` : '/api/users';
      const method = selectedUser ? 'PUT' : 'POST';

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <button
          onClick={handleAddUser}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add User</span>
        </button>
      </div>

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

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Departments</option>
          {uniqueDepartments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
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
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                        className="text-blue-600 hover:text-blue-900"
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

      {/* Add/Edit User Modal */}
      {(showAddModal || showEditModal) && (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
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