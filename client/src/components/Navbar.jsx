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
  ChevronDown
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
    <header className="h-13 bg-zinc-950 border-b border-zinc-850 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Active Connection Status */}
      <div className="flex items-center gap-4">
        {/* Clean Typography Brand Header (No Icon Box) */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-widest text-zinc-100">
            VORTEX<span className="text-blue-500 ml-1">SSH</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        </div>

        {/* Active Session Dropdown / Selector */}
        {sessions.length > 0 ? (
          <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
            <div className="relative group">
              <button className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-200 transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-zinc-200 max-w-[130px] truncate">
                  {activeSession ? (activeSession.name || activeSession.host) : 'Select Session'}
                </span>
                <span className="text-zinc-500 text-[10px]">
                  ({activeSession ? `${activeSession.username}@${activeSession.host}` : ''})
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded shadow-xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 font-mono">
                  Active Sessions ({sessions.length})
                </div>
                {sessions.map(s => (
                  <div
                    key={s.sessionId}
                    onClick={() => setActiveSessionId(s.sessionId)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-zinc-800/60 transition-colors ${
                      s.sessionId === activeSessionId ? 'bg-zinc-800 text-blue-400 font-medium' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="truncate">{s.name || s.host}</span>
                      <span className="text-[10px] text-zinc-500">({s.username})</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        disconnectSession(s.sessionId);
                      }}
                      title="Disconnect session"
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                    >
                      <Unplug className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-3 border-l border-zinc-800 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
            <span>Disconnected</span>
          </div>
        )}
      </div>

      {/* Main Tab Switcher Pills (Solid & Clean, No Gradients) */}
      <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
        <button
          onClick={() => setActiveTab('hosts')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'hosts'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Hosts</span>
        </button>

        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'terminal'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Terminal</span>
          {sessions.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-zinc-700 rounded text-zinc-300 font-mono font-bold">
              {sessions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sftp')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'sftp'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>SFTP</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Health</span>
        </button>

        <button
          onClick={() => setActiveTab('tunnels')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'tunnels'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Tunnels</span>
        </button>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2">
        {/* Terminal Split Controls (only when on terminal tab) */}
        {activeTab === 'terminal' && (
          <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5">
            <button
              onClick={() => setTerminalSplit('single')}
              title="Single Terminal"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                terminalSplit === 'single' ? 'bg-zinc-800 text-blue-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setTerminalSplit(terminalSplit === 'split-vertical' ? 'single' : 'split-vertical')}
              title="Split Vertical (Side-by-Side)"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                terminalSplit === 'split-vertical' ? 'bg-zinc-800 text-blue-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Split V
            </button>
            <button
              onClick={() => setTerminalSplit(terminalSplit === 'split-horizontal' ? 'single' : 'split-horizontal')}
              title="Split Horizontal (Stacked)"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                terminalSplit === 'split-horizontal' ? 'bg-zinc-800 text-blue-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
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
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
            isSnippetDrawerOpen 
              ? 'bg-zinc-800 border-zinc-700 text-zinc-100' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Snippets</span>
        </button>

        {/* Theme Selector */}
        <div className="relative group">
          <button
            title="Terminal Theme"
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded shadow-xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 font-mono">
              Terminal Theme
            </div>
            {Object.entries(TERMINAL_THEMES).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setTerminalTheme(key)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-800 ${
                  terminalTheme === key ? 'text-blue-400 font-medium' : 'text-zinc-300'
                }`}
              >
                <span>{item.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full border border-zinc-700"
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
          className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Connect / New Server Button (Solid Blue, No Gradient) */}
        <button
          onClick={() => setIsHostModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Host</span>
        </button>
      </div>
    </header>
  );
}
