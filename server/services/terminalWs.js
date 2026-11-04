import { sshManager } from './sshManager.js';
import { storage } from './storage.js';

const MAX_BUFFER_LENGTH = 200000; // ~200KB of terminal history playback

function appendBuffer(session, text) {
  session.shellBuffer = (session.shellBuffer || '') + text;
  if (session.shellBuffer.length > MAX_BUFFER_LENGTH) {
    session.shellBuffer = session.shellBuffer.slice(session.shellBuffer.length - (MAX_BUFFER_LENGTH / 2));
  }
}

function broadcastToSession(session, payload) {
  if (!session || !session.activeWs) return;
  const message = JSON.stringify(payload);
  for (const ws of session.activeWs) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

export function setupTerminalWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    let boundSession = null;
    let isAlive = true;

    const pingTimer = setInterval(() => {
      if (!isAlive) {
        clearInterval(pingTimer);
        return ws.terminate();
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('pong', () => {
      isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message.toString());

        switch (msg.type) {
          case 'init': {
            const sessionId = msg.sessionId || `term-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            let session = sshManager.getSession(sessionId);

            if (!session) {
              let hostConfig = null;
              if (msg.hostId) {
                hostConfig = storage.getHostRaw(msg.hostId);
                if (!hostConfig) {
                  ws.send(JSON.stringify({ type: 'error', error: 'Host configuration not found' }));
                  return;
                }
              } else if (msg.hostData) {
                hostConfig = msg.hostData;
              } else {
                ws.send(JSON.stringify({ type: 'error', error: 'No active session or host data provided' }));
                return;
              }

              ws.send(JSON.stringify({ 
                type: 'status', 
                status: 'connecting', 
                message: `Connecting to ${hostConfig.username}@${hostConfig.host}:${hostConfig.port || 22}...` 
              }));

              try {
                session = await sshManager.createSession(sessionId, hostConfig);
              } catch (connErr) {
                ws.send(JSON.stringify({ type: 'error', error: `SSH Connection failed: ${connErr.message}` }));
                return;
              }
            }

            boundSession = session;
            if (!session.activeWs) session.activeWs = new Set();
            session.activeWs.add(ws);

            const cols = msg.cols || 80;
            const rows = msg.rows || 24;

            // If session already has an active shell running, reuse it and replay history!
            if (session.shellStream) {
              ws.send(JSON.stringify({
                type: 'ready',
                sessionId,
                sessionInfo: session.info,
                isReattach: true
              }));

              // Replay existing output history buffer
              if (session.shellBuffer && session.shellBuffer.length > 0) {
                ws.send(JSON.stringify({ type: 'data', data: session.shellBuffer }));
              }

              // Set window size for the reattached client
              try {
                session.shellStream.setWindow(rows, cols, 0, 0);
              } catch (_) {}
              return;
            }

            // Otherwise, spawn new interactive shell
            session.client.shell(
              {
                term: 'xterm-256color',
                cols,
                rows
              },
              (err, stream) => {
                if (err) {
                  ws.send(JSON.stringify({ type: 'error', error: `Failed to open shell: ${err.message}` }));
                  return;
                }

                session.shellStream = stream;

                ws.send(JSON.stringify({
                  type: 'ready',
                  sessionId,
                  sessionInfo: session.info,
                  isReattach: false
                }));

                stream.on('data', (chunk) => {
                  const text = chunk.toString('utf8');
                  appendBuffer(session, text);
                  broadcastToSession(session, { type: 'data', data: text });
                });

                stream.stderr.on('data', (chunk) => {
                  const text = chunk.toString('utf8');
                  appendBuffer(session, text);
                  broadcastToSession(session, { type: 'data', data: text });
                });

                stream.on('close', () => {
                  broadcastToSession(session, { type: 'closed', message: 'Shell session closed by remote' });
                  session.shellStream = null;
                  session.shellBuffer = '';
                });

                stream.on('error', (streamErr) => {
                  broadcastToSession(session, { type: 'error', error: streamErr.message });
                });
              }
            );
            break;
          }

          case 'data': {
            if (boundSession && boundSession.shellStream) {
              boundSession.shellStream.write(msg.data);
            }
            break;
          }

          case 'resize': {
            if (boundSession && boundSession.shellStream && msg.cols && msg.rows) {
              try {
                boundSession.shellStream.setWindow(msg.rows, msg.cols, 0, 0);
              } catch (e) {
                console.warn('Failed to resize window:', e.message);
              }
            }
            break;
          }

          case 'disconnect': {
            if (boundSession) {
              if (boundSession.shellStream) {
                try { boundSession.shellStream.end(); } catch (_) {}
              }
              sshManager.closeSession(boundSession.info.sessionId);
              broadcastToSession(boundSession, { type: 'closed', message: 'Disconnected by user' });
              boundSession = null;
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling terminal WS message:', err);
      }
    });

    ws.on('close', () => {
      clearInterval(pingTimer);
      if (boundSession && boundSession.activeWs) {
        boundSession.activeWs.delete(ws);
        // Note: we purposely DO NOT terminate the shell stream here!
        // The shell remains alive in the session so background tasks / history are kept!
      }
    });

    ws.on('error', (err) => {
      console.warn('Terminal WS error:', err.message);
    });
  });
}
