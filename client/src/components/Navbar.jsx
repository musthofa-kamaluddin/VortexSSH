import React from 'react';
import { useSsh } from '../context/SshContext';
import { 
  Terminal, 
  FolderGit2, 
  Activity, 
  Network, 
  Zap, 
  Server, 
  Plus, 
  Maximize2, 
  Palette, 
  Unplug, 
  ChevronDown,
  Layers
} from 'lucide-react';
import { TERMINAL_THEMES } from '../themes/terminalThemes';

export function Navbar() {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeTab,
    setActiveTab,
    setIsHostModalOpen,
    isSnippetDrawerOpen,
    setIsSnippetDrawerOpen,
    terminalTheme,
    setTerminalTheme,
    terminalSplit,
    setTerminalSplit,
    disconnectSession
  } = useSsh();

  const activeSession = sessions.find(s => s.sessionId === activeSessionId);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-vortex-850/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Active Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
              Vortex<span className="text-cyan-400 font-extrabold">SSH</span>
            </span>
          </div>
        </div>

        {/* Active Session Dropdown / Selector */}
        {sessions.length > 0 ? (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 text-xs font-mono text-slate-200 transition-all">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium text-slate-100 max-w-[140px] truncate">
                  {activeSession ? (activeSession.name || activeSession.host) : 'Select Session'}
                </span>
                <span className="text-slate-400 text-[10px]">
                  ({activeSession ? `${activeSession.username}@${activeSession.host}` : ''})
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full mt-1 w-64 bg-vortex-800 border border-slate-700/80 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                  Active Sessions ({sessions.length})
                </div>
                {sessions.map(s => (
                  <div
                    key={s.sessionId}
                    onClick={() => setActiveSessionId(s.sessionId)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-slate-700/40 transition-colors ${
                      s.sessionId === activeSessionId ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="truncate">{s.name || s.host}</span>
                      <span className="text-[10px] text-slate-500">({s.username})</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        disconnectSession(s.sessionId);
                      }}
                      title="Disconnect session"
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    >
                      <Unplug className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            <span>Disconnected</span>
          </div>
        )}
      </div>

      {/* Main Tab Switcher Pills */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800/80">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'terminal'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Terminal</span>
          {sessions.length > 1 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-slate-800/80 rounded-full text-indigo-300 font-bold">
              {sessions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sftp')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'sftp'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>SFTP Files</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'metrics'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Server Health</span>
        </button>

        <button
          onClick={() => setActiveTab('tunnels')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'tunnels'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Port Tunnels</span>
        </button>

        <button
          onClick={() => setActiveTab('hosts')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'hosts'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Hosts Manager</span>
        </button>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2">
        {/* Terminal Split Controls (only when on terminal tab) */}
        {activeTab === 'terminal' && (
          <div className="flex items-center bg-slate-900/80 rounded-md border border-slate-800 p-0.5">
            <button
              onClick={() => setTerminalSplit('single')}
              title="Single Terminal"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                terminalSplit === 'single' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setTerminalSplit(terminalSplit === 'split-vertical' ? 'single' : 'split-vertical')}
              title="Split Vertical (Side-by-Side)"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                terminalSplit === 'split-vertical' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split V
            </button>
            <button
              onClick={() => setTerminalSplit(terminalSplit === 'split-horizontal' ? 'single' : 'split-horizontal')}
              title="Split Horizontal (Stacked)"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                terminalSplit === 'split-horizontal' ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split H
            </button>
          </div>
        )}

        {/* Snippet Drawer Trigger */}
        <button
          onClick={() => setIsSnippetDrawerOpen(!isSnippetDrawerOpen)}
          title="Quick Snippet Library"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
            isSnippetDrawerOpen 
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
              : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Snippets</span>
        </button>

        {/* Theme Selector */}
        <div className="relative group">
          <button
            title="Terminal Theme"
            className="p-1.5 rounded-md bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
          >
            <Palette className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-vortex-800 border border-slate-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              Terminal Theme
            </div>
            {Object.entries(TERMINAL_THEMES).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setTerminalTheme(key)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700/40 ${
                  terminalTheme === key ? 'text-cyan-400 font-semibold' : 'text-slate-300'
                }`}
              >
                <span>{item.name}</span>
                <span
                  className="w-3 h-3 rounded-full border border-slate-600"
                  style={{ backgroundColor: item.theme.background }}
                ></span>
              </button>
            ))}
          </div>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-1.5 rounded-md bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Connect / New Server Button */}
        <button
          onClick={() => setIsHostModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs rounded-md shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Connect</span>
        </button>
      </div>
    </header>
  );
}
