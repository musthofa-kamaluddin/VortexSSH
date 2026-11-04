import React, { useState, useEffect } from 'react';
import { useSsh } from '../../context/SshContext';
import { api } from '../../utils/api';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  Server, 
  Search, 
  RefreshCw, 
  XOctagon, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';

export function ServerDashboard() {
  const { activeSessionId, sessions, addToast, setIsHostModalOpen } = useSsh();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchProcess, setSearchProcess] = useState('');
  const [killingPid, setKillingPid] = useState(null);

  const activeSession = sessions.find(s => s.sessionId === activeSessionId);

  const fetchMetrics = async () => {
    if (!activeSessionId) return;
    try {
      setLoading(true);
      const res = await api.getMetrics(activeSessionId);
      setMetrics(res.metrics);
    } catch (err) {
      console.warn('Metrics polling error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!autoRefresh || !activeSessionId) return;

    const timer = setInterval(() => {
      fetchMetrics();
    }, 4000);

    return () => clearInterval(timer);
  }, [activeSessionId, autoRefresh]);

  const handleKill = async (pid, name) => {
    if (!window.confirm(`Terminate process PID ${pid} (${name})?`)) return;
    try {
      setKillingPid(pid);
      await api.killProcess(activeSessionId, pid, '9');
      addToast(`Process ${pid} terminated`, 'success');
      fetchMetrics();
    } catch (err) {
      addToast(`Failed to kill process: ${err.message}`, 'error');
    } finally {
      setKillingPid(null);
    }
  };

  if (!activeSessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-vortex-900 select-none">
        <div className="max-w-md w-full glass-panel-elevated p-8 rounded-2xl text-center border border-slate-800">
          <Activity className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">No Active Server Selected</h2>
          <p className="text-xs text-slate-400 mb-6">Select or connect to an active SSH server to monitor real-time system metrics.</p>
          <button
            onClick={() => setIsHostModalOpen(true)}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-all"
          >
            Connect Server
          </button>
        </div>
      </div>
    );
  }

  const cpuPercent = metrics?.cpu?.usagePercent || 0;
  const memPercent = metrics?.memory?.percent || 0;
  const processes = (metrics?.processes || []).filter(p => 
    p.command.toLowerCase().includes(searchProcess.toLowerCase()) || 
    p.pid.includes(searchProcess)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-vortex-900 overflow-y-auto p-4 sm:p-6 gap-6 select-none">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{activeSession?.name || activeSession?.host}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                {metrics?.uptime ? metrics.uptime.split(',')[0].replace('up', 'Up') : 'Reading uptime...'}
              </span>
              <span>•</span>
              <span>Load: {metrics?.loadAvg?.join(', ') || '0.00, 0.00, 0.00'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Live Stream (4s)</span>
          </label>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>CPU Utilization</span>
            </div>
            <span className={`text-xl font-bold font-mono ${
              cpuPercent > 80 ? 'text-rose-400' : cpuPercent > 50 ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {cpuPercent}%
            </span>
          </div>

          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                cpuPercent > 80 ? 'bg-rose-500' : cpuPercent > 50 ? 'bg-amber-400' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, cpuPercent))}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 text-center text-[11px] font-mono text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-850">
            <div>
              <span className="text-zinc-500 block text-[10px]">USER</span>
              <span className="text-zinc-200 font-semibold">{metrics?.cpu?.user || 0}%</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">SYSTEM</span>
              <span className="text-zinc-200 font-semibold">{metrics?.cpu?.system || 0}%</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">IDLE</span>
              <span className="text-zinc-200 font-semibold">{metrics?.cpu?.idle || 0}%</span>
            </div>
          </div>
        </div>

        {/* RAM Card */}
        <div className="bg-zinc-900 p-5 rounded border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>RAM Memory</span>
            </div>
            <span className={`text-xl font-bold font-mono ${
              memPercent > 85 ? 'text-rose-400' : memPercent > 65 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {memPercent}%
            </span>
          </div>

          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                memPercent > 85 ? 'bg-rose-500' : memPercent > 65 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, memPercent))}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 text-center text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
            <div>
              <span className="text-slate-500 block text-[10px]">USED</span>
              <span className="text-slate-200 font-semibold">{metrics?.memory?.used || 0} MB</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">FREE</span>
              <span className="text-slate-200 font-semibold">{metrics?.memory?.free || 0} MB</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL</span>
              <span className="text-slate-200 font-semibold">{metrics?.memory?.total || 0} MB</span>
            </div>
          </div>
        </div>

        {/* Disk Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Primary Storage</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {metrics?.disks?.[0]?.mount || '/'}
            </span>
          </div>

          {metrics?.disks && metrics.disks.length > 0 ? (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-bold font-mono text-indigo-400">
                  {metrics.disks[0].percent}%
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {metrics.disks[0].used} / {metrics.disks[0].size}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.disks[0].percent))}%` }}
                ></div>
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                Available: <span className="text-emerald-400 font-semibold">{metrics.disks[0].available}</span>
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Checking partitions...</p>
          )}
        </div>
      </div>

      {/* Top Running Processes Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 bg-vortex-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Top Active Processes</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                {processes.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Processes sorted by CPU utilization</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by process name or PID..."
              value={searchProcess}
              onChange={(e) => setSearchProcess(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-vortex-850/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-24">PID</th>
                <th className="py-2.5 px-4 font-semibold w-28">User</th>
                <th className="py-2.5 px-4 font-semibold w-24">CPU %</th>
                <th className="py-2.5 px-4 font-semibold w-24">MEM %</th>
                <th className="py-2.5 px-4 font-semibold">Command</th>
                <th className="py-2.5 px-4 font-semibold w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {processes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No matching processes found
                  </td>
                </tr>
              ) : (
                processes.map(proc => (
                  <tr key={proc.pid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-4 text-cyan-400">{proc.pid}</td>
                    <td className="py-2 px-4 text-slate-400">{proc.user}</td>
                    <td className={`py-2 px-4 font-semibold ${proc.cpu > 20 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {proc.cpu}%
                    </td>
                    <td className="py-2 px-4">{proc.mem}%</td>
                    <td className="py-2 px-4 text-slate-300 truncate max-w-md" title={proc.command}>
                      {proc.command}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleKill(proc.pid, proc.command)}
                        disabled={killingPid === proc.pid}
                        title="Kill process (SIGKILL)"
                        className="px-2 py-1 text-[10px] font-sans font-medium rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors inline-flex items-center gap-1"
                      >
                        {killingPid === proc.pid ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <XOctagon className="w-3 h-3" />
                        )}
                        <span>Kill</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
