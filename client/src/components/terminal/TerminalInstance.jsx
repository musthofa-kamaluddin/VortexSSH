import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useSsh } from '../../context/SshContext';
import { TERMINAL_THEMES } from '../../themes/terminalThemes';
import { RefreshCw, Terminal as TerminalIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

export function TerminalInstance({ sessionId, sessionInfo }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const { terminalTheme, fontSize, registerTerminalSender, addToast, activeTab } = useSsh();

  const connectTerminal = () => {
    if (!containerRef.current) return;
    setStatus('connecting');
    setErrorMessage('');

    // Clean up existing
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
    }
    if (xtermRef.current) {
      try { xtermRef.current.dispose(); } catch (_) {}
    }

    const term = new Terminal({
      cursorBlink: true,
      fontSize: fontSize || 14,
      fontFamily: '"Fira Code", monospace, "Courier New"',
      theme: TERMINAL_THEMES[terminalTheme]?.theme || TERMINAL_THEMES.cyberpunk.theme,
      allowTransparency: true,
      convertEol: true
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    containerRef.current.innerHTML = '';
    term.open(containerRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    setTimeout(() => {
      try { fitAddon.fit(); } catch (_) {}
    }, 100);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const dims = fitAddon.proposeDimensions();
      const cols = dims?.cols || 80;
      const rows = dims?.rows || 24;

      ws.send(JSON.stringify({
        type: 'init',
        sessionId,
        cols,
        rows
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'data') {
          term.write(msg.data);
        } else if (msg.type === 'ready') {
          setStatus('connected');
        } else if (msg.type === 'error') {
          setStatus('error');
          setErrorMessage(msg.error || 'Unknown error');
          term.write(`\r\n\x1b[31m[Error] ${msg.error}\x1b[0m\r\n`);
        } else if (msg.type === 'closed') {
          setStatus('disconnected');
          term.write(`\r\n\x1b[33m[Connection closed]\x1b[0m\r\n`);
        }
      } catch (e) {
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      setErrorMessage('WebSocket connection failed');
    };

    ws.onclose = () => {
      setStatus('disconnected');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data }));
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });
  };

  useEffect(() => {
    connectTerminal();

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (_) {}
      }
    };

    window.addEventListener('resize', handleResize);

    // Register sender for snippets
    const unregister = registerTerminalSender(sessionId, (cmd) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'data', data: cmd }));
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unregister();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (_) {}
      }
      if (xtermRef.current) {
        try { xtermRef.current.dispose(); } catch (_) {}
      }
    };
  }, [sessionId]);

  // Update theme dynamically
  useEffect(() => {
    if (xtermRef.current && TERMINAL_THEMES[terminalTheme]) {
      xtermRef.current.options.theme = TERMINAL_THEMES[terminalTheme].theme;
    }
  }, [terminalTheme]);

  // Update font size dynamically
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = fontSize;
      if (fitAddonRef.current) {
        try { fitAddonRef.current.fit(); } catch (_) {}
      }
    }
  }, [fontSize]);

  // Refit and focus when user switches back to terminal tab
  useEffect(() => {
    if (activeTab === 'terminal' && fitAddonRef.current && xtermRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current.fit();
          xtermRef.current.focus();
        } catch (_) {}
      }, 60);
    }
  }, [activeTab]);

  return (
    <div className="relative w-full h-full flex flex-col bg-vortex-900 overflow-hidden select-text">
      {/* Session Header / Info Bar */}
      <div className="h-8 bg-vortex-850 px-3 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">{sessionInfo?.name || sessionInfo?.host || 'Terminal'}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {sessionInfo?.username}@{sessionInfo?.host}:{sessionInfo?.port || 22}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {status === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 text-[11px]">Online</span>
              </>
            )}
            {status === 'connecting' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-amber-400 text-[11px]">Connecting...</span>
              </>
            )}
            {status === 'disconnected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span className="text-slate-400 text-[11px]">Disconnected</span>
              </>
            )}
            {status === 'error' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-400 text-[11px]">Error</span>
              </>
            )}
          </div>

          <button
            onClick={connectTerminal}
            title="Reconnect terminal"
            className="p-1 hover:text-cyan-400 text-slate-400 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 w-full h-full overflow-hidden p-2 terminal-container" ref={containerRef} />
    </div>
  );
}
