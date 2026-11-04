import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const SshContext = createContext(null);

export function SshProvider({ children }) {
  const [hosts, setHosts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [splitSessionId, setSplitSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState('hosts'); // Defaults to 'hosts' on first access
  const [terminalSplit, setTerminalSplit] = useState('single'); // 'single' | 'split-vertical' | 'split-horizontal'
  const [terminalTheme, setTerminalTheme] = useState('cyberpunk');
  const [fontSize, setFontSize] = useState(14);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isSnippetDrawerOpen, setIsSnippetDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Stream callbacks for terminals
  const terminalSendRef = useRef(new Map());

  const addToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshHosts = async () => {
    try {
      const res = await api.getHosts();
      setHosts(res.hosts || []);
    } catch (err) {
      console.warn('Failed to fetch hosts:', err.message);
    }
  };

  const refreshSessions = async () => {
    try {
      const res = await api.getSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.warn('Failed to fetch sessions:', err.message);
    }
  };

  useEffect(() => {
    refreshHosts();
    refreshSessions();
  }, []);

  const registerTerminalSender = (sessionId, senderFn) => {
    terminalSendRef.current.set(sessionId, senderFn);
    return () => {
      terminalSendRef.current.delete(sessionId);
    };
  };

  const sendToTerminal = (text, targetSessionId = null) => {
    const sessId = targetSessionId || activeSessionId;
    if (!sessId) {
      addToast('No active terminal session connected', 'error');
      return false;
    }
    const sender = terminalSendRef.current.get(sessId);
    if (sender) {
      sender(text.endsWith('\n') || text.endsWith('\r') ? text : `${text}\r`);
      addToast('Command sent to terminal', 'success');
      return true;
    } else {
      addToast('Terminal not ready to receive input', 'warning');
      return false;
    }
  };

  const connectToHost = async (hostIdOrConfig) => {
    try {
      let payload = {};
      if (typeof hostIdOrConfig === 'string') {
        payload = { hostId: hostIdOrConfig };
      } else {
        payload = { hostData: hostIdOrConfig };
      }

      addToast('Initiating SSH connection...', 'info');
      const res = await api.connectHost(payload);
      
      const newSession = {
        sessionId: res.sessionId,
        ...res.sessionInfo
      };

      setSessions(prev => {
        const filtered = prev.filter(s => s.sessionId !== res.sessionId);
        return [...filtered, newSession];
      });

      setActiveSessionId(res.sessionId);
      setActiveTab('terminal');
      addToast(`Connected to ${res.sessionInfo.name || res.sessionInfo.host}!`, 'success');
      refreshHosts();
      return res.sessionId;
    } catch (err) {
      addToast(`Connection error: ${err.message}`, 'error');
      throw err;
    }
  };

  const disconnectSession = async (sessionId) => {
    try {
      await api.disconnectSession(sessionId);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s.sessionId !== sessionId);
        setActiveSessionId(remaining.length > 0 ? remaining[0].sessionId : null);
      }
      if (splitSessionId === sessionId) {
        setSplitSessionId(null);
        setTerminalSplit('single');
      }
      addToast('Session disconnected', 'info');
    } catch (err) {
      addToast(`Error disconnecting: ${err.message}`, 'error');
    }
  };

  const reorderSessions = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setSessions(prev => {
      const copy = [...prev];
      if (fromIndex >= copy.length || toIndex >= copy.length) return prev;
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  return (
    <SshContext.Provider
      value={{
        hosts,
        refreshHosts,
        sessions,
        refreshSessions,
        reorderSessions,
        setSessions,
        activeSessionId,
        setActiveSessionId,
        splitSessionId,
        setSplitSessionId,
        activeTab,
        setActiveTab,
        terminalSplit,
        setTerminalSplit,
        terminalTheme,
        setTerminalTheme,
        fontSize,
        setFontSize,
        isHostModalOpen,
        setIsHostModalOpen,
        isSnippetDrawerOpen,
        setIsSnippetDrawerOpen,
        toasts,
        addToast,
        removeToast,
        connectToHost,
        disconnectSession,
        registerTerminalSender,
        sendToTerminal
      }}
    >
      {children}
    </SshContext.Provider>
  );
}

export function useSsh() {
  const context = useContext(SshContext);
  if (!context) throw new Error('useSsh must be used within SshProvider');
  return context;
}
