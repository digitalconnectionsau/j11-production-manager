import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import JobDetails from './pages/JobDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-charcoal text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleClientSelect = (clientId: number) => {
    setSelectedClientId(clientId);
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
  };

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setSelectedJobId(null);
  };

  const handleJobSelect = (jobId: number) => {
    setSelectedJobId(jobId);
  };

  const handleBackToProject = () => {
    setSelectedJobId(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Clients':
        if (selectedClientId) {
          return <ClientDetails clientId={selectedClientId} onBack={handleBackToClients} />;
        }
        return <Clients onClientSelect={handleClientSelect} />;
      case 'Projects':
        if (selectedJobId && selectedProjectId) {
          return <JobDetails jobId={selectedJobId} projectId={selectedProjectId} onBack={handleBackToProject} />;
        }
        if (selectedProjectId) {
          return <ProjectDetails projectId={selectedProjectId} onBack={handleBackToProjects} onJobSelect={handleJobSelect} />;
        }
        return <Projects onProjectSelect={handleProjectSelect} />;
      case 'Reports':
        return <Reports />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setSelectedClientId(null);
    setSelectedProjectId(null);
    setSelectedJobId(null);
  };

  const handleSidebarProjectSelect = (projectId: number) => {
    setCurrentPage('Projects');
    setSelectedProjectId(projectId);
    setSelectedClientId(null);
    setSelectedJobId(null);
  };

  return (
    <div className="min-h-screen bg-light-grey">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={handlePageChange} 
        onProjectSelect={handleSidebarProjectSelect}
      />
      <main className="ml-64 min-h-screen bg-white">
        {renderPage()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
