import ssh2 from 'ssh2';
const { Client } = ssh2;
import { CONFIG } from '../config.js';
import { storage } from './storage.js';

class SshManager {
  constructor() {
    /** @type {Map<string, { client: Client, info: any, sftp: any, createdAt: number }>} */
    this.sessions = new Map();
  }

  buildClientConfig(hostData) {
    const config = {
      host: hostData.host,
      port: hostData.port || 22,
      username: hostData.username,
      keepaliveInterval: CONFIG.SSH_KEEPALIVE_INTERVAL,
      keepaliveCountMax: 3,
      readyTimeout: CONFIG.SSH_READY_TIMEOUT,
      algorithms: {
        serverHostKey: [
          'ssh-ed25519',
          'ecdsa-sha2-nistp256',
          'ecdsa-sha2-nistp384',
          'ecdsa-sha2-nistp521',
          'rsa-sha2-512',
          'rsa-sha2-256',
          'ssh-rsa',
          'ssh-dss'
        ]
      }
    };

    if (hostData.authType === 'privateKey' && hostData.privateKey) {
      config.privateKey = hostData.privateKey;
      if (hostData.passphrase) {
        config.passphrase = hostData.passphrase;
      }
    } else if (hostData.password) {
      config.password = hostData.password;
    }

    return config;
  }

  async testConnection(hostData) {
    return new Promise((resolve, reject) => {
      const client = new Client();
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try { client.end(); } catch (_) {}
          reject(new Error('Connection timed out after 20 seconds.'));
        }
      }, CONFIG.SSH_READY_TIMEOUT);

      client.on('ready', () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          client.exec('uname -a || ver', (err, stream) => {
            let output = '';
            if (err) {
              client.end();
              return resolve({ success: true, message: 'Connected successfully.' });
            }
            stream.on('data', (d) => { output += d.toString(); });
            stream.on('close', () => {
              client.end();
              resolve({
                success: true,
                message: 'Connected successfully!',
                os: output.trim()
              });
            });
          });
        }
      });

      client.on('error', (err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          reject(err);
        }
      });

      try {
        const sshConfig = this.buildClientConfig(hostData);
        client.connect(sshConfig);
      } catch (err) {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    });
  }

  async createSession(sessionId, hostData) {
    // If existing session with same ID, close it
    if (this.sessions.has(sessionId)) {
      this.closeSession(sessionId);
    }

    return new Promise((resolve, reject) => {
      const client = new Client();
      let isReady = false;

      const timer = setTimeout(() => {
        if (!isReady) {
          try { client.end(); } catch (_) {}
          reject(new Error('SSH Connection timeout'));
        }
      }, CONFIG.SSH_READY_TIMEOUT);

      client.on('ready', () => {
        isReady = true;
        clearTimeout(timer);
        const sessionObj = {
          client,
          info: {
            sessionId,
            hostId: hostData.id || null,
            host: hostData.host,
            port: hostData.port,
            username: hostData.username,
            name: hostData.name || hostData.host,
            connectedAt: new Date().toISOString()
          },
          sftp: null,
          shellStream: null,
          shellBuffer: '',
          activeWs: new Set(),
          createdAt: Date.now()
        };
        this.sessions.set(sessionId, sessionObj);

        if (hostData.id) {
          storage.updateHostLastConnected(hostData.id);
        }

        resolve(sessionObj);
      });

      client.on('error', (err) => {
        console.error(`[SSH Session ${sessionId}] Error:`, err.message);
        if (!isReady) {
          clearTimeout(timer);
          reject(err);
        }
        this.closeSession(sessionId);
      });

      client.on('end', () => {
        console.log(`[SSH Session ${sessionId}] Ended`);
        this.sessions.delete(sessionId);
      });

      client.on('close', () => {
        console.log(`[SSH Session ${sessionId}] Closed`);
        this.sessions.delete(sessionId);
      });

      const sshConfig = this.buildClientConfig(hostData);
      client.connect(sshConfig);
    });
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  async getSftp(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found or disconnected');

    if (session.sftp) {
      return session.sftp;
    }

    return new Promise((resolve, reject) => {
      session.client.sftp((err, sftp) => {
        if (err) return reject(err);
        session.sftp = sftp;
        resolve(sftp);
      });
    });
  }

  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        if (session.shellStream) {
          session.shellStream.end();
        }
        if (session.sftp) {
          session.sftp.end();
        }
        session.client.end();
      } catch (e) {
        console.warn('Error closing SSH client:', e.message);
      }
      this.sessions.delete(sessionId);
    }
  }

  getActiveSessions() {
    return Array.from(this.sessions.values()).map(s => s.info);
  }
}

export const sshManager = new SshManager();
