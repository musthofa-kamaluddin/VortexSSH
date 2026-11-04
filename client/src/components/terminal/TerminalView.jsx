import React, { useState, useRef } from 'react';
import { useSsh } from '../../context/SshContext';
import { TerminalInstance } from './TerminalInstance';
import { 
  Terminal as TerminalIcon, 
  Plus, 
  X, 
  Server, 
  ChevronDown, 
  SplitSquareVertical, 
  SplitSquareHorizontal,
  GripVertical
} from 'lucide-react';

export function TerminalView() {
  const {
    hosts,
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    splitSessionId,
    terminalSplit,
    disconnectSession,
    setIsHostModalOpen,
    connectToHost,
    reorderSessions,
    addToast
  } = useSsh();

  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef(null);

  // Drag and drop tab reordering
  const handleDragStart = (e, index) => {
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedTabIndex !== null && draggedTabIndex !== targetIndex) {
      reorderSessions(draggedTabIndex, targetIndex);
    }
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  // Open additional shell on the same active server
  const handleNewShellOnActiveServer = async () => {
    setIsAddMenuOpen(false);
    const active = sessions.find(s => s.sessionId === activeSessionId);
    if (!active) {
      setIsHostModalOpen(true);
      return;
    }
    try {
      if (active.hostId) {
        await connectToHost(active.hostId);
      } else {
        await connectToHost({
          host: active.host,
          port: active.port,
          username: active.username,
          name: `${active.name || active.host} (Shell ${sessions.length + 1})`
        });
      }
      addToast(`Opened new shell on ${active.host}`, 'success');
    } catch (err) {
      addToast(`Failed to open shell: ${err.message}`, 'error');
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 select-none">
        <div className="max-w-sm w-full bg-zinc-900 p-8 rounded border border-zinc-800 text-center shadow-lg">
          <div className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-zinc-300">
            <TerminalIcon className="w-6 h-6" />
          </div>

          <h2 className="text-base font-semibold text-zinc-100 mb-1.5">No Active Sessions</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Connect to an SSH server or select a saved host to open an interactive terminal.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setIsHostModalOpen(true)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Connect to Server</span>
            </button>

            {hosts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                  Saved Hosts ({hosts.length})
                </span>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {hosts.map(h => (
                    <button
                      key={h.id}
                      onClick={() => connectToHost(h.id)}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium text-zinc-200 truncate">{h.name || h.host}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{h.username}@{h.host}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.sessionId === activeSessionId) || sessions[0];
  const secondarySession = sessions.find(s => s.sessionId === splitSessionId) || sessions.find(s => s.sessionId !== activeSession.sessionId) || activeSession;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Reorderable Tab Bar */}
      <div className="h-9 bg-zinc-900 px-2 flex items-center justify-between border-b border-zinc-850 select-none">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {sessions.map((s, index) => {
            const isActive = s.sessionId === activeSessionId;
            const isDragging = draggedTabIndex === index;
            const isOver = dragOverIndex === index && draggedTabIndex !== index;

            return (
              <div
                key={s.sessionId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setActiveSessionId(s.sessionId)}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-mono cursor-pointer transition-all border-t-2 select-none ${
                  isActive
                    ? 'bg-zinc-950 text-zinc-100 border-blue-500 font-semibold'
                    : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-850 hover:text-zinc-200'
                } ${isDragging ? 'opacity-40' : ''} ${isOver ? 'border-r-2 border-r-blue-400' : ''}`}
              >
                <GripVertical className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="max-w-[130px] truncate">{s.name || s.host}</span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectSession(s.sessionId);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-zinc-500 p-0.5 rounded transition-opacity ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Add Tab Button with Options Dropdown */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              title="Add Terminal Tab"
              className="flex items-center gap-0.5 p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <ChevronDown className="w-2.5 h-2.5 text-zinc-500" />
            </button>

            {/* Add Tab Popover Menu */}
            {isAddMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded shadow-2xl py-1 z-50 animate-scale-up">
                <div className="px-3 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  Add Terminal Tab
                </div>

                {/* Option 1: New Shell on Active Server */}
                <button
                  onClick={handleNewShellOnActiveServer}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-800 text-zinc-200 transition-colors"
                >
                  <TerminalIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-medium block text-zinc-200">New Shell on Active Host</span>
                    <span className="text-[10px] text-zinc-500 truncate block">
                      {activeSession.username}@{activeSession.host}
                    </span>
                  </div>
                </button>

                {/* Option 2: Connect from Saved Hosts */}
                {hosts.filter(h => h.id !== activeSession.hostId).length > 0 && (
                  <div className="border-t border-zinc-800/80 my-1 pt-1">
                    <div className="px-3 py-1 text-[10px] font-mono text-zinc-500 uppercase">
                      Other Saved Hosts
                    </div>
                    {hosts
                      .filter(h => h.id !== activeSession.hostId)
                      .slice(0, 4)
                      .map(h => (
                        <button
                          key={h.id}
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            connectToHost(h.id);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-800 text-zinc-300 transition-colors"
                        >
                          <span className="truncate">{h.name || h.host}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Port {h.port || 22}</span>
                        </button>
                      ))}
                  </div>
                )}

                {/* Option 3: New Host Modal */}
                <div className="border-t border-zinc-800/80 my-1 pt-1">
                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setIsHostModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-zinc-800 text-blue-400 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect to New Host...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Viewport Container (Single or Split) */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-zinc-950">
        {terminalSplit === 'single' ? (
          <TerminalInstance
            key={activeSession.sessionId}
            sessionId={activeSession.sessionId}
            sessionInfo={activeSession}
          />
        ) : terminalSplit === 'split-vertical' ? (
          <div className="w-full h-full flex flex-row divide-x divide-zinc-850">
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
          <div className="w-full h-full flex flex-col divide-y divide-zinc-850">
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
