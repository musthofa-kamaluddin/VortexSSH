import net from 'net';
import { sshManager } from './sshManager.js';
import { storage } from './storage.js';

class TunnelService {
  constructor() {
    /** @type {Map<string, { server: net.Server, status: string, connections: number, error: string|null, hostId: string }>} */
    this.activeTunnels = new Map();
  }

  async startTunnel(tunnelId) {
    const tunnels = storage.getTunnels();
    const tunnel = tunnels.find(t => t.id === tunnelId);
    if (!tunnel) throw new Error('Tunnel config not found');

    if (this.activeTunnels.has(tunnelId)) {
      return { success: true, message: 'Tunnel already running', status: 'running' };
    }

    const hostData = storage.getHostRaw(tunnel.hostId);
    if (!hostData) throw new Error('Associated host not found');

    // Make sure we have an SSH session or connect a dedicated one
    const tunnelSessionId = `tunnel-sess-${tunnel.id}`;
    let session = sshManager.getSession(tunnelSessionId);
    if (!session) {
      session = await sshManager.createSession(tunnelSessionId, hostData);
    }

    if (tunnel.type === 'local') {
      return new Promise((resolve, reject) => {
        const localServer = net.createServer((socket) => {
          const entry = this.activeTunnels.get(tunnelId);
          if (entry) entry.connections++;

          session.client.forwardOut(
            socket.remoteAddress || '127.0.0.1',
            socket.remotePort || 0,
            tunnel.remoteHost || '127.0.0.1',
            tunnel.remotePort,
            (err, stream) => {
              if (err) {
                console.error(`Tunnel forward error on ${tunnel.name}:`, err.message);
                socket.end();
                return;
              }
              socket.pipe(stream).pipe(socket);
              socket.on('close', () => {
                const e = this.activeTunnels.get(tunnelId);
                if (e && e.connections > 0) e.connections--;
              });
            }
          );
        });

        localServer.on('error', (err) => {
          console.error(`Tunnel server error on port ${tunnel.localPort}:`, err.message);
          this.activeTunnels.set(tunnelId, {
            server: null,
            status: 'error',
            connections: 0,
            error: err.message,
            hostId: tunnel.hostId
          });
          reject(err);
        });

        localServer.listen(tunnel.localPort, '127.0.0.1', () => {
          this.activeTunnels.set(tunnelId, {
            server: localServer,
            status: 'running',
            connections: 0,
            error: null,
            hostId: tunnel.hostId
          });
          resolve({ success: true, status: 'running', port: tunnel.localPort });
        });
      });
    } else {
      // Remote port forwarding
      return new Promise((resolve, reject) => {
        session.client.forwardIn('127.0.0.1', tunnel.remotePort, (err) => {
          if (err) {
            this.activeTunnels.set(tunnelId, {
              server: null,
              status: 'error',
              connections: 0,
              error: err.message,
              hostId: tunnel.hostId
            });
            return reject(err);
          }

          this.activeTunnels.set(tunnelId, {
            server: null,
            status: 'running',
            connections: 0,
            error: null,
            hostId: tunnel.hostId
          });

          resolve({ success: true, status: 'running' });
        });
      });
    }
  }

  async stopTunnel(tunnelId) {
    const active = this.activeTunnels.get(tunnelId);
    if (!active) {
      return { success: true, status: 'stopped' };
    }

    if (active.server) {
      try {
        active.server.close();
      } catch (err) {
        console.warn('Error closing local tunnel server:', err);
      }
    }

    const tunnelSessionId = `tunnel-sess-${tunnelId}`;
    sshManager.closeSession(tunnelSessionId);

    this.activeTunnels.delete(tunnelId);
    return { success: true, status: 'stopped' };
  }

  getStatus(tunnelId) {
    const active = this.activeTunnels.get(tunnelId);
    if (!active) {
      return { id: tunnelId, status: 'stopped', connections: 0, error: null };
    }
    return {
      id: tunnelId,
      status: active.status,
      connections: active.connections,
      error: active.error
    };
  }

  getAllStatuses() {
    const result = {};
    for (const [id, data] of this.activeTunnels.entries()) {
      result[id] = {
        status: data.status,
        connections: data.connections,
        error: data.error
      };
    }
    return result;
  }
}

export const tunnelService = new TunnelService();
