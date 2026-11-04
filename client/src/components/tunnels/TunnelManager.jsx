import React, { useState, useEffect } from 'react';
import { useSsh } from '../../context/SshContext';
import { api } from '../../utils/api';
import { 
  Network, 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';

export function TunnelManager() {
  const { hosts, addToast } = useSsh();
  const [tunnels, setTunnels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // New tunnel form state
  const [name, setName] = useState('');
  const [hostId, setHostId] = useState('');
  const [type, setType] = useState('local');
  const [localPort, setLocalPort] = useState('8080');
  const [remoteHost, setRemoteHost] = useState('127.0.0.1');
  const [remotePort, setRemotePort] = useState('80');

  const fetchTunnels = async () => {
    try {
      setLoading(true);
      const res = await api.getTunnels();
      setTunnels(res.tunnels || []);
    } catch (err) {
      addToast(`Failed to load tunnels: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTunnels();
    if (hosts.length > 0 && !hostId) {
      setHostId(hosts[0].id);
    }
  }, [hosts]);

  const handleToggle = async (tunnel) => {
    try {
      setTogglingId(tunnel.id);
      if (tunnel.status === 'running') {
        await api.stopTunnel(tunnel.id);
        addToast(`Tunnel "${tunnel.name}" stopped`, 'info');
      } else {
        await api.startTunnel(tunnel.id);
        addToast(`Tunnel "${tunnel.name}" started on port ${tunnel.localPort}`, 'success');
      }
      fetchTunnels();
    } catch (err) {
      addToast(`Tunnel error: ${err.message}`, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete tunnel "${name}"?`)) return;
    try {
      await api.deleteTunnel(id);
      addToast(`Tunnel "${name}" deleted`, 'success');
      fetchTunnels();
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!hostId || !localPort || !remotePort) {
      addToast('Please fill all required fields', 'warning');
      return;
    }
    try {
      await api.saveTunnel({
        name: name || `Tunnel ${localPort}->${remotePort}`,
        hostId,
        type,
        localPort: parseInt(localPort, 10),
        remoteHost: remoteHost || '127.0.0.1',
        remotePort: parseInt(remotePort, 10)
      });
      addToast('Tunnel created successfully', 'success');
      setIsAddModalOpen(false);
      setName('');
      fetchTunnels();
    } catch (err) {
      addToast(`Create failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-vortex-900 p-6 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>SSH Port Forwarding & Tunnels</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Securely forward remote server services (databases, internal web dashboards) to your local machine.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Tunnel</span>
        </button>
      </div>

      {/* Tunnel Cards Grid */}
      {tunnels.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-slate-800 text-center">
          <Network className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No active tunnels configured</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Create a local port forwarding rule to access remote MySQL, Redis, or internal microservices as if they were running on localhost.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tunnels.map(tun => {
            const host = hosts.find(h => h.id === tun.hostId);
            const isRunning = tun.status === 'running';

            return (
              <div
                key={tun.id}
                className={`glass-panel p-5 rounded-xl border transition-all ${
                  isRunning ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white truncate">{tun.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Via {host ? (host.name || host.host) : 'Saved Host'}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                    isRunning 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                    <span>{isRunning ? 'Active' : 'Stopped'}</span>
                  </span>
                </div>

                {/* Port Flow Diagram */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 my-4 text-xs font-mono">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block">LOCAL</span>
                    <span className="text-cyan-400 font-bold">127.0.0.1:{tun.localPort}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500" />

                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 block">REMOTE</span>
                    <span className="text-indigo-300 font-bold">{tun.remoteHost}:{tun.remotePort}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleDelete(tun.id, tun.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggle(tun)}
                    disabled={togglingId === tun.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isRunning
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {togglingId === tun.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isRunning ? (
                      <Square className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{isRunning ? 'Stop Tunnel' : 'Start Tunnel'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Tunnel Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-vortex-850 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-4"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              <span>Create SSH Port Tunnel</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Tunnel Name</label>
              <input
                type="text"
                placeholder="e.g. Remote PostgreSQL Database"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Target SSH Host</label>
              <select
                value={hostId}
                onChange={e => setHostId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {hosts.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name || h.host} ({h.username}@{h.host}:{h.port})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Local Port</label>
                <input
                  type="number"
                  placeholder="5432"
                  value={localPort}
                  onChange={e => setLocalPort(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Remote Port</label>
                <input
                  type="number"
                  placeholder="5432"
                  value={remotePort}
                  onChange={e => setRemotePort(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Remote Target Host</label>
              <input
                type="text"
                placeholder="127.0.0.1 or internal hostname"
                value={remoteHost}
                onChange={e => setRemoteHost(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
              >
                Create Tunnel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
