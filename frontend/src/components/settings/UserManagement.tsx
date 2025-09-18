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

  // Mock data for development (since database isn't set up yet)
  const mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@j11.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      mobile: '+61 400 123 456',
      department: 'Management',
      position: 'System Administrator',
      phone: '+61 7 5555 0001',
      isActive: true,
      isBlocked: false,
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      roles: [{ roleId: 1, roleName: 'super_admin', roleDisplayName: 'Super Administrator' }],
    },
    {
      id: 2,
      email: 'craig@j11.com',
      username: 'craig',
      firstName: 'Craig',
      lastName: 'Parker',
      mobile: '+61 400 456 789',
      department: 'Production',
      position: 'Production Manager',
      phone: '+61 7 5555 0002',
      isActive: true,
      isBlocked: false,
      lastLogin: '2024-01-15T09:15:00Z',
      createdAt: '2024-01-02T00:00:00Z',
      roles: [{ roleId: 2, roleName: 'project_manager', roleDisplayName: 'Project Manager' }],
    },
    {
      id: 3,
      email: 'john@j11.com',
      username: 'john.smith',
      firstName: 'John',
      lastName: 'Smith',
      mobile: '+61 400 789 012',
      department: 'Production',
      position: 'Production Assistant',
      phone: '+61 7 5555 0003',
      isActive: true,
      isBlocked: false,
      lastLogin: '2024-01-14T16:45:00Z',
      createdAt: '2024-01-03T00:00:00Z',
      roles: [{ roleId: 3, roleName: 'production_user', roleDisplayName: 'Production User' }],
    },
  ];

  const mockRoles: Role[] = [
    { id: 1, name: 'super_admin', displayName: 'Super Administrator', description: 'Full system access', isSuperAdmin: true },
    { id: 2, name: 'admin', displayName: 'Administrator', description: 'Administrative access', isSuperAdmin: false },
    { id: 3, name: 'project_manager', displayName: 'Project Manager', description: 'Manage projects and jobs', isSuperAdmin: false },
    { id: 4, name: 'production_user', displayName: 'Production User', description: 'View and update job statuses', isSuperAdmin: false },
    { id: 5, name: 'viewer', displayName: 'Viewer', description: 'Read-only access', isSuperAdmin: false },
  ];

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, departmentFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // For now, use mock data
      // In production, this would fetch from the API
      setUsers(mockUsers);
      setRoles(mockRoles);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load users' });
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
        // API call would go here
        setMessage({ type: 'success', text: `User ${user.isBlocked ? 'unblocked' : 'blocked'} successfully` });
        loadData();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to update user status' });
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}? This action can be undone.`)) {
      try {
        // API call would go here
        setMessage({ type: 'success', text: 'User deactivated successfully' });
        loadData();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to deactivate user' });
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API call would go here
      setMessage({ type: 'success', text: selectedUser ? 'User updated successfully' : 'User created successfully' });
      setShowAddModal(false);
      setShowEditModal(false);
      loadData();
    } catch (error) {
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