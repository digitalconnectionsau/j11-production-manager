import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
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
  const [selectedProjectTab, setSelectedProjectTab] = useState<'jobs' | 'info'>('jobs');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check for reset password token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
    }
  }, []);

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
    // Show reset password page if there's a token
    if (resetToken) {
      return (
        <ResetPassword 
          token={resetToken} 
          onBack={() => {
            setResetToken(null);
            // Clear URL parameters
            window.history.replaceState({}, '', window.location.pathname);
          }} 
        />
      );
    }
    return <Login />;
  }

  const handleClientSelect = (clientId: number) => {
    setSelectedClientId(clientId);
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
  };

  const handleProjectSelect = (projectId: number, tab: 'jobs' | 'info' = 'jobs') => {
    setSelectedProjectId(projectId);
    setSelectedProjectTab(tab);
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
          return <ProjectDetails 
            projectId={selectedProjectId} 
            onBack={handleBackToProjects} 
            onJobSelect={handleJobSelect} 
            initialTab={selectedProjectTab}
          />;
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
    setSelectedProjectTab('jobs');
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
