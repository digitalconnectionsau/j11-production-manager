import React, { useState } from 'react';
import JobStatusManagement from '../components/settings/JobStatusManagement';
import HolidaysManagement from '../components/HolidaysManagement';
import LeadTimesManagement from '../components/settings/LeadTimesManagement';
import UserManagement from '../components/settings/UserManagement';
import ImportManagement from '../components/settings/ImportManagement';
import ArchivedClientsManagement from '../components/settings/ArchivedClientsManagement';

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

interface DisplaySettings {
  weekType: string;
  weekStartDay: string;
  weekCalculationBase: string;
}

interface SettingsProps {
  initialTab?: 'holidays' | 'job-status' | 'lead-times' | 'import' | 'company' | 'system' | 'users' | 'archived-clients' | 'display';
  openProfileEdit?: boolean;
  onProfileEditClose?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ initialTab = 'holidays', openProfileEdit = false, onProfileEditClose }) => {
  const [activeTab, setActiveTab] = useState<'holidays' | 'job-status' | 'lead-times' | 'import' | 'company' | 'system' | 'users' | 'archived-clients' | 'display'>(initialTab);
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
  
  // Display settings state
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem('displaySettings');
    return saved ? JSON.parse(saved) : {
      weekType: 'calendar',
      weekStartDay: 'monday',
      weekCalculationBase: 'delivery'
    };
  });
  const [displayLoading, setDisplayLoading] = useState(false);
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

  // Update display settings
  const updateDisplaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDisplayLoading(true);
      // Save to localStorage
      localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
      
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMessage({ type: 'success', text: 'Display settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save display settings' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDisplayLoading(false);
    }
  };

  const tabs = [
    { id: 'holidays', label: 'Holidays', icon: '📅' },
    { id: 'job-status', label: 'Job Status', icon: '⚡' },
    { id: 'lead-times', label: 'Lead Times', icon: '⏱️' },
    { id: 'import', label: 'Import', icon: '📁' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'archived-clients', label: 'Archived Clients', icon: '📋' },
    { id: 'display', label: 'Display', icon: '📊' },
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

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ImportManagement />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <UserManagement openProfileEdit={openProfileEdit} onProfileEditClose={onProfileEditClose} />
        </div>
      )}

      {/* Archived Clients Tab */}
      {activeTab === 'archived-clients' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ArchivedClientsManagement />
        </div>
      )}

      {/* Display Tab */}
      {activeTab === 'display' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
          
          <form onSubmit={updateDisplaySettings}>
            <div className="space-y-6">
              {/* Week Separator Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Week Separators</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configure how weeks are separated in the jobs table when the "Week Separators" toggle is enabled.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Week Type
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={displaySettings.weekType}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, weekType: e.target.value }))}
                    >
                      <option value="calendar">Calendar Week (1st-7th, 8th-14th, etc.)</option>
                      <option value="work">Work Week (configurable start day)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Week Start Day (for Work Week)
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={displaySettings.weekStartDay}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, weekStartDay: e.target.value }))}
                      disabled={displaySettings.weekType !== 'work'}
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Week Calculation On
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={displaySettings.weekCalculationBase}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, weekCalculationBase: e.target.value }))}
                    >
                      <option value="delivery">Delivery Date (Default)</option>
                      <option value="nesting">Nesting Date</option>
                      <option value="machining">Machining Date</option>
                      <option value="assembly">Assembly Date</option>
                      <option value="earliest">Earliest Date (Any Stage)</option>
                      <option value="latest">Latest Date (Any Stage)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose which date to use for determining which week a job belongs to.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={displayLoading}
                className="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                style={{ 
                  backgroundColor: displayLoading ? '#9CA3AF' : '#FF661F', 
                  borderColor: displayLoading ? '#9CA3AF' : '#FF661F'
                }}
                onMouseEnter={(e) => !displayLoading && ((e.target as HTMLButtonElement).style.backgroundColor = '#E55A1A')}
                onMouseLeave={(e) => !displayLoading && ((e.target as HTMLButtonElement).style.backgroundColor = '#FF661F')}
              >
                {displayLoading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{displayLoading ? 'Saving...' : 'Save Display Settings'}</span>
              </button>
            </div>
          </form>
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
