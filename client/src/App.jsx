import React, { useState } from 'react';
import { SshProvider, useSsh } from './context/SshContext';
import { Navbar } from './components/Navbar';
import { TerminalView } from './components/terminal/TerminalView';
import { SftpExplorer } from './components/sftp/SftpExplorer';
import { ServerDashboard } from './components/metrics/ServerDashboard';
import { TunnelManager } from './components/tunnels/TunnelManager';
import { HostListTab } from './components/hosts/HostListTab';
import { SnippetDrawer } from './components/snippets/SnippetDrawer';
import { HostManagerModal } from './components/hosts/HostManagerModal';
import { ToastContainer } from './components/common/ToastContainer';

function MainLayout() {
  const { activeTab, isHostModalOpen, setIsHostModalOpen } = useSsh();
  const [editingHost, setEditingHost] = useState(null);

  const handleEditHost = (host) => {
    setEditingHost(host);
    setIsHostModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingHost(null);
    setIsHostModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-vortex-900 text-slate-100 overflow-hidden font-sans">
      <Navbar />

      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
        <div className={`w-full h-full ${activeTab === 'terminal' ? 'flex flex-col' : 'hidden'}`}>
          <TerminalView />
        </div>
        <div className={`w-full h-full ${activeTab === 'sftp' ? 'flex flex-col' : 'hidden'}`}>
          <SftpExplorer />
        </div>
        <div className={`w-full h-full ${activeTab === 'metrics' ? 'flex flex-col' : 'hidden'}`}>
          <ServerDashboard />
        </div>
        <div className={`w-full h-full ${activeTab === 'tunnels' ? 'flex flex-col' : 'hidden'}`}>
          <TunnelManager />
        </div>
        <div className={`w-full h-full ${activeTab === 'hosts' ? 'flex flex-col' : 'hidden'}`}>
          <HostListTab onEditHost={handleEditHost} />
        </div>
      </main>

      {/* Slide-out Snippet Drawer */}
      <SnippetDrawer />

      {/* Host Configuration Modal */}
      {isHostModalOpen && (
        <HostManagerModal
          isOpen={isHostModalOpen}
          onClose={handleCloseModal}
          initialHost={editingHost}
        />
      )}

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <SshProvider>
      <MainLayout />
    </SshProvider>
  );
}
