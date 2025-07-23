import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Reports from './pages/Reports';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
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
        if (selectedProjectId) {
          return <ProjectDetails projectId={selectedProjectId} onBack={handleBackToProjects} />;
        }
        return <Projects onProjectSelect={handleProjectSelect} />;
      case 'Reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setSelectedClientId(null);
    setSelectedProjectId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="ml-64 min-h-screen">
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
