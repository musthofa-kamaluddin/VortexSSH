import React, { useState } from 'react';
import { useSsh } from '../../context/SshContext';
import { api } from '../../utils/api';
import { 
  Server, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Search, 
  ShieldCheck, 
  Key, 
  Clock, 
  Tag, 
  Sparkles 
} from 'lucide-react';

export function HostListTab({ onEditHost }) {
  const { hosts, refreshHosts, connectToHost, setIsHostModalOpen, addToast } = useSsh();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const allTags = ['All', ...new Set(hosts.flatMap(h => h.tags || []).filter(Boolean))];

  const filteredHosts = hosts
    .filter(h => selectedTag === 'All' || (h.tags && h.tags.includes(selectedTag)))
    .filter(h => 
      h.name?.toLowerCase().includes(search.toLowerCase()) || 
      h.host?.toLowerCase().includes(search.toLowerCase()) ||
      h.username?.toLowerCase().includes(search.toLowerCase())
    );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete server profile "${name}"?`)) return;
    try {
      await api.deleteHost(id);
      addToast(`Host "${name}" deleted`, 'info');
      refreshHosts();
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-vortex-900 p-6 overflow-y-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>Saved Server Hosts & Credentials</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your SSH connection profiles. All passwords and private keys are encrypted locally with AES-256-GCM.
          </p>
        </div>

        <button
          onClick={() => setIsHostModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Server</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search hosts, IP, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Tags filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                selectedTag === tag
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Hosts Grid */}
      {filteredHosts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-slate-800 text-center">
          <Server className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No servers found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
            Add a new host profile or connect to the local demo mock server.
          </p>
          <button
            onClick={() => setIsHostModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Create Host Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHosts.map(host => (
            <div
              key={host.id}
              className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: host.color || '#3b82f6' }}
                    />
                    <h3 className="text-sm font-bold text-white truncate">{host.name || host.host}</h3>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    Port {host.port || 22}
                  </span>
                </div>

                {/* Host details */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 my-3 font-mono text-xs text-slate-300 flex flex-col gap-1">
                  <div className="text-cyan-400 font-medium truncate">
                    {host.username}@{host.host}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {host.authType === 'privateKey' ? (
                      <span className="flex items-center gap-1 text-indigo-400">
                        <Key className="w-3 h-3" /> SSH Key
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Password
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {host.lastConnected ? new Date(host.lastConnected).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {host.tags && host.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {host.tags.map(t => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditHost(host)}
                    title="Edit profile"
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(host.id, host.name)}
                    title="Delete profile"
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => connectToHost(host.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-500/20 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>Connect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
