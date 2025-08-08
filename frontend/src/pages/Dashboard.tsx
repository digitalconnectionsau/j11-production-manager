import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-charcoal mt-2">Welcome to your production management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Total Projects</p>
              <p className="text-2xl font-bold text-black">12</p>
            </div>
            <div className="w-12 h-12 bg-light-grey rounded-lg flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Active Clients</p>
              <p className="text-2xl font-bold text-black">8</p>
            </div>
            <div className="w-12 h-12 bg-light-grey rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Pending Tasks</p>
              <p className="text-2xl font-bold text-black">24</p>
            </div>
            <div className="w-12 h-12 bg-light-grey rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Revenue (MTD)</p>
              <p className="text-2xl font-bold text-black">$45.2K</p>
            </div>
            <div className="w-12 h-12 bg-light-grey rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-light-grey">
          <h2 className="text-xl font-semibold text-black mb-4">Recent Projects</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-light-grey rounded-lg">
              <div>
                <p className="font-medium text-black">Website Redesign</p>
                <p className="text-sm text-charcoal">Client: ABC Corp</p>
              </div>
              <span className="px-2 py-1 bg-primary bg-opacity-20 text-primary text-xs font-medium rounded-full">
                In Progress
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-light-grey rounded-lg">
              <div>
                <p className="font-medium text-black">Mobile App Development</p>
                <p className="text-sm text-charcoal">Client: XYZ Inc</p>
              </div>
              <span className="px-2 py-1 bg-primary bg-opacity-20 text-primary text-xs font-medium rounded-full">
                Planning
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-light-grey rounded-lg">
              <div>
                <p className="font-medium text-black">Brand Identity</p>
                <p className="text-sm text-charcoal">Client: StartUp Co</p>
              </div>
              <span className="px-2 py-1 bg-primary bg-opacity-20 text-primary text-xs font-medium rounded-full">
                Review
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-light-grey">
          <h2 className="text-xl font-semibold text-black mb-4">Upcoming Deadlines</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-primary">
              <div>
                <p className="font-medium text-black">Final Design Review</p>
                <p className="text-sm text-charcoal">Due: Tomorrow</p>
              </div>
              <span className="text-primary font-medium">High</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-light-grey rounded-lg border-l-4 border-charcoal">
              <div>
                <p className="font-medium text-black">Client Presentation</p>
                <p className="text-sm text-charcoal">Due: In 3 days</p>
              </div>
              <span className="text-charcoal font-medium">Medium</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-light-grey rounded-lg border-l-4 border-charcoal">
              <div>
                <p className="font-medium text-black">Project Kickoff</p>
                <p className="text-sm text-charcoal">Due: Next week</p>
              </div>
              <span className="text-charcoal font-medium">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
