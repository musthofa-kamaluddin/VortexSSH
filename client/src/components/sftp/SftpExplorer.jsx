import React, { useState, useEffect, useRef } from 'react';
import { useSsh } from '../../context/SshContext';
import { api } from '../../utils/api';
import { FileEditorModal } from './FileEditorModal';
import { 
  Folder, 
  File, 
  FileText, 
  FileCode, 
  Archive, 
  Image as ImageIcon, 
  Upload, 
  FolderPlus, 
  RefreshCw, 
  Download, 
  Trash2, 
  Edit3, 
  Shield, 
  ChevronRight, 
  Home, 
  ArrowUp, 
  Eye, 
  EyeOff, 
  Search, 
  Loader2, 
  HardDrive,
  Settings,
  Globe,
  Clock,
  Box,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Layers,
  Check
} from 'lucide-react';

function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(item) {
  if (item.isDirectory) {
    return <Folder className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  const ext = item.name.split('.').pop().toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'sh', 'php', 'html', 'css', 'json', 'yml', 'yaml', 'sql', 'c', 'cpp'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
  }
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext)) {
    return <Archive className="w-4 h-4 text-rose-400 shrink-0" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (['txt', 'log', 'md', 'conf', 'env', 'ini'].includes(ext)) {
    return <FileText className="w-4 h-4 text-indigo-400 shrink-0" />;
  }
  return <File className="w-4 h-4 text-slate-400 shrink-0" />;
}

export function SftpExplorer() {
  const { activeSessionId, sessions, addToast, setIsHostModalOpen } = useSsh();
  const [currentPath, setCurrentPath] = useState('.');
  const [pathInput, setPathInput] = useState('.');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(true);
  const [activeEditorFile, setActiveEditorFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef(null);

  const activeSession = sessions.find(s => s.sessionId === activeSessionId);

  const loadDirectory = async (targetPath = currentPath) => {
    if (!activeSessionId) return;
    try {
      setLoading(true);
      const res = await api.listSftp(activeSessionId, targetPath);
      setCurrentPath(res.currentPath);
      setPathInput(res.currentPath);
      setItems(res.items || []);
    } catch (err) {
      addToast(`SFTP error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      loadDirectory('.');
    }
  }, [activeSessionId]);

  if (!activeSessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-vortex-900 select-none">
        <div className="max-w-md w-full glass-panel-elevated p-8 rounded-2xl text-center border border-slate-800">
          <Folder className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-base font-bold text-white mb-2">No Active Connection</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Connect to an SSH server to browse, transfer, and edit remote files.
          </p>
          <button
            onClick={() => setIsHostModalOpen(true)}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-all shadow-md shadow-indigo-600/20"
          >
            Connect Server
          </button>
        </div>
      </div>
    );
  }

  const navigateUp = () => {
    if (currentPath === '/' || currentPath === '.') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const upPath = '/' + parts.join('/');
    loadDirectory(upPath || '/');
  };

  const handleItemClick = (item) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    } else {
      setActiveEditorFile(item.path);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = window.prompt('Enter new folder name:');
    if (!folderName) return;
    try {
      const newFolderPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
      await api.mkdirSftp(activeSessionId, newFolderPath);
      addToast(`Folder "${folderName}" created`, 'success');
      loadDirectory();
    } catch (err) {
      addToast(`Failed to create folder: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await api.deleteSftp(activeSessionId, item.path, item.isDirectory);
      addToast(`Deleted "${item.name}"`, 'success');
      loadDirectory();
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleRename = async (item, e) => {
    e.stopPropagation();
    const newName = window.prompt(`Rename "${item.name}" to:`, item.name);
    if (!newName || newName === item.name) return;
    try {
      const parent = currentPath === '/' ? '' : currentPath;
      const newPath = `${parent}/${newName}`;
      await api.renameSftp(activeSessionId, item.path, newPath);
      addToast(`Renamed to "${newName}"`, 'success');
      loadDirectory();
    } catch (err) {
      addToast(`Rename failed: ${err.message}`, 'error');
    }
  };

  const handleChmod = async (item, e) => {
    e.stopPropagation();
    const mode = window.prompt(`Enter new octal permissions for "${item.name}" (e.g. 755 or 644):`, item.permissions);
    if (!mode) return;
    try {
      await api.chmodSftp(activeSessionId, item.path, mode);
      addToast(`Permissions updated to ${mode}`, 'success');
      loadDirectory();
    } catch (err) {
      addToast(`Chmod failed: ${err.message}`, 'error');
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      addToast(`Uploading ${file.name}...`, 'info');
      await api.uploadSftp(activeSessionId, currentPath, file);
      addToast(`Uploaded ${file.name} successfully`, 'success');
      loadDirectory();
    } catch (err) {
      addToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        addToast(`Uploading ${file.name}...`, 'info');
        await api.uploadSftp(activeSessionId, currentPath, file);
        addToast(`Uploaded ${file.name}`, 'success');
      } catch (err) {
        addToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
      }
    }
    loadDirectory();
  };

  const filteredItems = items
    .filter(i => showHidden || !i.name.startsWith('.'))
    .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const folderCount = filteredItems.filter(i => i.isDirectory).length;
  const fileCount = filteredItems.filter(i => !i.isDirectory).length;

  // Breadcrumbs
  const pathParts = currentPath.split('/').filter(Boolean);

  // Quick Access Items
  const userHome = activeSession?.username === 'root' ? '/root' : `/home/${activeSession?.username || 'user'}`;
  const quickAccessFolders = [
    { label: 'User Home', path: userHome, icon: Home },
    { label: 'Root (/)', path: '/', icon: HardDrive },
    { label: 'System Config (/etc)', path: '/etc', icon: Settings },
    { label: 'Logs (/var/log)', path: '/var/log', icon: FileText },
    { label: 'Web (/var/www)', path: '/var/www', icon: Globe },
    { label: 'Temp (/tmp)', path: '/tmp', icon: Clock },
    { label: 'Apps (/opt)', path: '/opt', icon: Box },
  ];

  return (
    <div 
      className="flex-1 flex flex-row h-full bg-vortex-900 overflow-hidden relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-indigo-950/85 backdrop-blur-sm border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-12 h-12 text-cyan-400 animate-bounce mb-3" />
          <p className="text-base font-bold text-white">Drop files here to upload</p>
          <p className="text-xs text-cyan-300 font-mono mt-1">Target: {currentPath}</p>
        </div>
      )}

      {/* SFTP Left Sidebar */}
      {isSidebarOpen && (
        <aside className="w-60 bg-vortex-850/90 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
          {/* Quick Access List */}
          <div className="p-3">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quick Access</span>
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse sidebar"
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-0.5">
              {quickAccessFolders.map((fav) => {
                const IconComponent = fav.icon;
                const isSelected = currentPath === fav.path;
                return (
                  <button
                    key={fav.path}
                    onClick={() => loadDirectory(fav.path)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-600/20 text-cyan-300 font-semibold border border-indigo-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="truncate">{fav.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer Info Card */}
          <div className="p-3 border-t border-slate-800/80 bg-vortex-900/60">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200 truncate">
                {activeSession?.name || activeSession?.host}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex flex-col gap-1">
              <div className="truncate text-slate-500">
                User: <span className="text-slate-300">{activeSession?.username}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{folderCount} folders</span>
                <span>•</span>
                <span>{fileCount} files</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main File Explorer Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* SFTP Toolbar */}
        <div className="h-12 bg-vortex-850 px-4 flex items-center justify-between border-b border-slate-800 gap-3 select-none">
          {/* Navigation Breadcrumbs / Address Bar */}
          <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="Expand sidebar"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors mr-1"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => loadDirectory('/')}
              title="Go to root"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              onClick={navigateUp}
              disabled={currentPath === '/' || currentPath === '.'}
              title="Go up one folder"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Path segments */}
            <div className="flex-1 flex items-center bg-slate-900/90 border border-slate-700/60 rounded-md px-2.5 py-1 text-xs font-mono text-slate-200 overflow-x-auto no-scrollbar">
              <span 
                onClick={() => loadDirectory('/')}
                className="cursor-pointer text-slate-400 hover:text-cyan-400 font-semibold"
              >
                /
              </span>
              {pathParts.map((part, index) => {
                const segPath = '/' + pathParts.slice(0, index + 1).join('/');
                return (
                  <React.Fragment key={segPath}>
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 mx-0.5" />
                    <span
                      onClick={() => loadDirectory(segPath)}
                      className="cursor-pointer hover:text-cyan-400 truncate max-w-[120px]"
                    >
                      {part}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Box */}
            <div className="relative w-36 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/60 rounded-md pl-8 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={() => setShowHidden(!showHidden)}
              title={showHidden ? 'Hide dotfiles' : 'Show dotfiles'}
              className={`p-1.5 rounded-md border text-xs transition-colors ${
                showHidden ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCreateFolder}
              title="New Folder"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadFile}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload File"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <button
              onClick={() => loadDirectory()}
              title="Refresh Directory"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* File List Table */}
        <div className="flex-1 overflow-y-auto select-none">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs">Fetching file listing...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs">
              <Folder className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
              <span>Folder is empty</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-vortex-850 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Name</th>
                  <th className="py-2.5 px-4 font-semibold w-24">Size</th>
                  <th className="py-2.5 px-4 font-semibold w-24 hidden md:table-cell">Perms</th>
                  <th className="py-2.5 px-4 font-semibold w-40 hidden sm:table-cell">Modified</th>
                  <th className="py-2.5 px-4 font-semibold w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredItems.map(item => (
                  <tr
                    key={item.path}
                    onDoubleClick={() => handleItemClick(item)}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-2 px-4 flex items-center gap-2.5 truncate">
                      {getFileIcon(item)}
                      <span 
                        onClick={() => handleItemClick(item)}
                        className={`truncate text-xs ${
                          item.isDirectory ? 'text-amber-200 font-semibold hover:text-amber-300' : 'text-slate-200 hover:text-cyan-300'
                        }`}
                      >
                        {item.name}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-400 text-[11px]">
                      {item.isDirectory ? '-' : formatBytes(item.size)}
                    </td>
                    <td className="py-2 px-4 text-slate-500 text-[11px] hidden md:table-cell">
                      {item.permissions}
                    </td>
                    <td className="py-2 px-4 text-slate-500 text-[11px] hidden sm:table-cell truncate">
                      {item.modifyTime ? new Date(item.modifyTime).toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!item.isDirectory && (
                          <>
                            <button
                              onClick={() => setActiveEditorFile(item.path)}
                              title="Edit file"
                              className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-700/60"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={api.getDownloadUrl(activeSessionId, item.path)}
                              download={item.name}
                              title="Download file"
                              className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-700/60"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={(e) => handleChmod(item, e)}
                          title="Permissions (chmod)"
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-700/60"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleRename(item, e)}
                          title="Rename"
                          className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-700/60"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item, e)}
                          title="Delete"
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* In-App Editor Modal */}
      {activeEditorFile && (
        <FileEditorModal
          sessionId={activeSessionId}
          filePath={activeEditorFile}
          onClose={() => {
            setActiveEditorFile(null);
            loadDirectory();
          }}
        />
      )}
    </div>
  );
}
