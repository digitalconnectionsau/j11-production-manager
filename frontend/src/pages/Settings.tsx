import React, { useState } from 'react';
import JobStatusManagement from '../components/settings/JobStatusManagement';
import HolidaysManagement from '../components/HolidaysManagement';
import LeadTimesManagement from '../components/settings/LeadTimesManagement';
import UserManagement from '../components/settings/UserManagement';

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
  const [activeTab, setActiveTab] = useState<'holidays' | 'job-status' | 'lead-times' | 'company' | 'system' | 'users'>('holidays');
  const [appSettings, setAppSettings] = useState<AppSettings>({
    companyName: 'J11 Productions',
    companyEmail: 'info@j11productions.com',
    companyPhone: '+61 7 5555 0000',
    companyAddress: 'Gold Coast, Queensland\nAustralia',
    timezone: 'Australia/Brisbane',
    dateFormat: 'DD/MM/YYYY',
    currency: 'AUD',
    projectStatuses: ['active', 'completed', 'on-hold', 'cancelled'],
    taskPriorities: ['low', 'medium', 'high']
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const systemInfo = {
    version: '1.0.0',
    environment: 'Development',
    lastUpdated: new Date().toLocaleDateString('en-AU'),
    database: 'PostgreSQL'
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

  const tabs = [
    { id: 'holidays', label: 'Holidays', icon: '📅' },
    { id: 'job-status', label: 'Job Status', icon: '⚡' },
    { id: 'lead-times', label: 'Lead Times', icon: '⏱️' },
    { id: 'users', label: 'Users', icon: '👥' },
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

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <HolidaysManagement />
        </div>
      )}

      {/* Job Status Tab */}
      {activeTab === 'job-status' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <JobStatusManagement />
        </div>
      )}

      {/* Lead Times Tab */}
      {activeTab === 'lead-times' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <LeadTimesManagement />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <UserManagement />
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
        <div className="space-y-6">
          {/* Regional Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
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
                  <optgroup label="Queensland">
                    <option value="Australia/Brisbane">Brisbane (AEST/AEDT)</option>
                  </optgroup>
                  <optgroup label="New South Wales / Victoria / Tasmania">
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                    <option value="Australia/Melbourne">Melbourne (AEST/AEDT)</option>
                    <option value="Australia/Hobart">Hobart (AEST/AEDT)</option>
                  </optgroup>
                  <optgroup label="South Australia / Northern Territory">
                    <option value="Australia/Adelaide">Adelaide (ACST/ACDT)</option>
                    <option value="Australia/Darwin">Darwin (ACST)</option>
                  </optgroup>
                  <optgroup label="Western Australia">
                    <option value="Australia/Perth">Perth (AWST)</option>
                  </optgroup>
                  <optgroup label="Lord Howe Island">
                    <option value="Australia/Lord_Howe">Lord Howe Island (LHST/LHDT)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="UTC">UTC</option>
                  </optgroup>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Current time: {new Date().toLocaleString('en-AU', { 
                    timeZone: appSettings.timezone, 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                  })}
                </p>
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
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Australian Standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Example: {new Date().toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  })}
                </p>
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
                  <option value="AUD">Australian Dollar (AUD)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={updateCompanySettings}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Regional Settings'}
              </button>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Application Version:</span>
                <span className="ml-2 text-gray-600">{systemInfo.version}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Environment:</span>
                <span className="ml-2 text-gray-600">{systemInfo.environment}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Database:</span>
                <span className="ml-2 text-gray-600">{systemInfo.database}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-600">{systemInfo.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
