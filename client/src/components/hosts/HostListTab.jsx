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
  Clock 
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
    <div className="flex-1 flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" />
            <span>Server Hosts & Credentials</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your SSH connection profiles. Credentials are encrypted locally with AES-256-GCM.
          </p>
        </div>

        <button
          onClick={() => setIsHostModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Server</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter hosts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tags filter */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedTag === tag
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-medium'
                  : 'bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Hosts Grid */}
      {filteredHosts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-900 rounded border border-zinc-800 text-center">
          <Server className="w-10 h-10 text-zinc-600 mb-2.5" />
          <h3 className="text-sm font-medium text-zinc-300">No servers configured</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mb-4 leading-relaxed">
            Add your remote SSH servers or VPS profiles to start managing them.
          </p>
          <button
            onClick={() => setIsHostModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
          >
            Add New Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHosts.map(host => (
            <div
              key={host.id}
              className="bg-zinc-900 p-4 rounded border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: host.color || '#3b82f6' }}
                    />
                    <h3 className="text-sm font-semibold text-zinc-100 truncate">{host.name || host.host}</h3>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    Port {host.port || 22}
                  </span>
                </div>

                {/* Host details */}
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 my-2.5 font-mono text-xs text-zinc-300 flex flex-col gap-1">
                  <div className="text-blue-400 font-medium truncate">
                    {host.username}@{host.host}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    {host.authType === 'privateKey' ? (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Key className="w-3 h-3 text-blue-400" /> Key
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-400">
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
                  <div className="flex flex-wrap gap-1 mb-3">
                    {host.tags.map(t => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-750"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditHost(host)}
                    title="Edit profile"
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(host.id, host.name)}
                    title="Delete profile"
                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => connectToHost(host.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
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
