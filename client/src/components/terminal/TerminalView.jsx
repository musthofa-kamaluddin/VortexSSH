import React from 'react';
import { useSsh } from '../../context/SshContext';
import { TerminalInstance } from './TerminalInstance';
import { Terminal as TerminalIcon, Plus, X, Server, Sparkles, SplitSquareVertical, SplitSquareHorizontal } from 'lucide-react';

export function TerminalView() {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    splitSessionId,
    setSplitSessionId,
    terminalSplit,
    setTerminalSplit,
    disconnectSession,
    setIsHostModalOpen,
    connectToHost
  } = useSsh();

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-vortex-900 select-none">
        <div className="max-w-md w-full glass-panel-elevated p-8 rounded-2xl text-center border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 mx-auto mb-5 shadow-xl shadow-cyan-500/20">
            <div className="w-full h-full bg-vortex-900 rounded-2xl flex items-center justify-center">
              <TerminalIcon className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">No Active SSH Session</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Connect to a remote Linux/Unix server, VPS, or test environment with interactive terminal, SFTP, and monitoring.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsHostModalOpen(true)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm rounded-lg shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Connect to Server</span>
            </button>

            {/* Quick Demo Button with Mock Server */}
            <button
              onClick={() => {
                connectToHost({
                  name: 'Local Demo Host',
                  host: '127.0.0.1',
                  port: 2222,
                  username: 'vortex',
                  authType: 'password',
                  password: 'vortexpass123'
                }).catch(() => {
                  // If mock server not yet started, inform user
                });
              }}
              className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Connect to Local Demo Server (port 2222)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.sessionId === activeSessionId) || sessions[0];
  const secondarySession = sessions.find(s => s.sessionId === splitSessionId) || sessions.find(s => s.sessionId !== activeSession.sessionId) || activeSession;

  return (
    <div className="flex-1 flex flex-col h-full bg-vortex-900 overflow-hidden">
      {/* Multi-Tab Bar */}
      <div className="h-10 bg-vortex-850 px-2 flex items-center justify-between border-b border-slate-800/80 select-none">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {sessions.map(s => {
            const isActive = s.sessionId === activeSessionId;
            return (
              <div
                key={s.sessionId}
                onClick={() => setActiveSessionId(s.sessionId)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer transition-all border-t-2 ${
                  isActive
                    ? 'bg-vortex-900 text-cyan-400 border-cyan-400 font-semibold shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="max-w-[130px] truncate">{s.name || s.host}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectSession(s.sessionId);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 p-0.5 rounded transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setIsHostModalOpen(true)}
            title="Open New Connection"
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 rounded transition-colors ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Display Container (Single or Split) */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {terminalSplit === 'single' ? (
          <TerminalInstance
            key={activeSession.sessionId}
            sessionId={activeSession.sessionId}
            sessionInfo={activeSession}
          />
        ) : terminalSplit === 'split-vertical' ? (
          <div className="w-full h-full flex flex-row divide-x divide-slate-800">
            <div className="w-1/2 h-full">
              <TerminalInstance
                key={activeSession.sessionId}
                sessionId={activeSession.sessionId}
                sessionInfo={activeSession}
              />
            </div>
            <div className="w-1/2 h-full">
              <TerminalInstance
                key={secondarySession.sessionId}
                sessionId={secondarySession.sessionId}
                sessionInfo={secondarySession}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col divide-y divide-slate-800">
            <div className="w-full h-1/2">
              <TerminalInstance
                key={activeSession.sessionId}
                sessionId={activeSession.sessionId}
                sessionInfo={activeSession}
              />
            </div>
            <div className="w-full h-1/2">
              <TerminalInstance
                key={secondarySession.sessionId}
                sessionId={secondarySession.sessionId}
                sessionInfo={secondarySession}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
