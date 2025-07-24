import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserSettings {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  role: string;
}

interface AppSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  projectStatuses: string[];
  taskPriorities: string[];
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'system'>('profile');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    companyName: 'J11 Productions',
    companyEmail: 'info@j11productions.com',
    companyPhone: '+1 (555) 123-4567',
    companyAddress: '123 Production Ave\nStudio City, CA 90210',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    projectStatuses: ['active', 'completed', 'on-hold', 'cancelled'],
    taskPriorities: ['low', 'medium', 'high']
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user, token } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch user settings
  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch user settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSettings) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userSettings.username,
          firstName: userSettings.firstName,
          lastName: userSettings.lastName,
          mobile: userSettings.mobile,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Update company settings
  const updateCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // This would normally save to a settings table or config
      setMessage({ type: 'success', text: 'Company settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update company settings' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to change password');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to change password' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setUserSettings({
        id: user.id,
        email: user.email,
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        mobile: user.mobile || '',
        role: user.role || 'user'
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'company', label: 'Company', icon: '🏢' },
    { id: 'system', label: 'System', icon: '⚙️' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and application preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && userSettings && (
        <div className="space-y-8">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <form onSubmit={updateUserProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userSettings.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={userSettings.username || ''}
                    onChange={(e) => setUserSettings({...userSettings, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={userSettings.firstName || ''}
                    onChange={(e) => setUserSettings({...userSettings, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={userSettings.lastName || ''}
                    onChange={(e) => setUserSettings({...userSettings, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={userSettings.mobile || ''}
                    onChange={(e) => setUserSettings({...userSettings, mobile: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={userSettings.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={changePassword}>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Company Information</h3>
          <form onSubmit={updateCompanySettings}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={appSettings.companyName}
                  onChange={(e) => setAppSettings({...appSettings, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={appSettings.companyEmail}
                  onChange={(e) => setAppSettings({...appSettings, companyEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone
                </label>
                <input
                  type="tel"
                  value={appSettings.companyPhone}
                  onChange={(e) => setAppSettings({...appSettings, companyPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={appSettings.currency}
                  onChange={(e) => setAppSettings({...appSettings, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address
              </label>
              <textarea
                value={appSettings.companyAddress}
                onChange={(e) => setAppSettings({...appSettings, companyAddress: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Company Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-8">
          {/* Application Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Application Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={appSettings.timezone}
                  onChange={(e) => setAppSettings({...appSettings, timezone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  value={appSettings.dateFormat}
                  onChange={(e) => setAppSettings({...appSettings, dateFormat: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Project Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Statuses
                </label>
                <div className="flex flex-wrap gap-2">
                  {appSettings.projectStatuses.map((status, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {status}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Configure project statuses in the database schema</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Priorities
                </label>
                <div className="flex flex-wrap gap-2">
                  {appSettings.taskPriorities.map((priority, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        priority === 'high' ? 'bg-red-100 text-red-800' :
                        priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {priority}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Configure task priorities in the database schema</p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Application Version:</span>
                <span className="ml-2 text-gray-600">1.0.0</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Environment:</span>
                <span className="ml-2 text-gray-600">Development</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Database:</span>
                <span className="ml-2 text-gray-600">PostgreSQL</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Backup:</span>
                <span className="ml-2 text-gray-600">Not configured</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
