import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CONFIG } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

export function encrypt(text, masterKey = CONFIG.MASTER_KEY) {
  if (!text) return '';
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(masterKey, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Combine salt:iv:tag:encrypted
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted
  ].join(':');
}

export function decrypt(encryptedData, masterKey = CONFIG.MASTER_KEY) {
  if (!encryptedData) return '';
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) return encryptedData; // Unencrypted fallback

    const [saltHex, ivHex, tagHex, encryptedText] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const key = getKey(masterKey, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return '';
  }
}

const DEFAULT_SNIPPETS = [
  {
    id: 'snip-1',
    title: 'System & Hardware Info',
    category: 'System',
    command: 'uname -a && cat /etc/os-release && lscpu | grep "Model name"',
    description: 'Displays kernel, OS distribution, and CPU details'
  },
  {
    id: 'snip-2',
    title: 'Disk Usage (Human Readable)',
    category: 'Storage',
    command: 'df -hT --exclude-type=tmpfs --exclude-type=devtmpfs',
    description: 'Check partition usage and mounted filesystems'
  },
  {
    id: 'snip-3',
    title: 'Memory Usage Breakdown',
    category: 'Monitoring',
    command: 'free -h --wide',
    description: 'Quick snapshot of RAM, swap, and buffer cache'
  },
  {
    id: 'snip-4',
    title: 'Top 10 Memory Consuming Processes',
    category: 'Monitoring',
    command: 'ps aux --sort=-%mem | awk \'NR<=11{print $1,$2,$3,$4,$11}\' | column -t',
    description: 'Find processes eating the most RAM'
  },
  {
    id: 'snip-5',
    title: 'Docker Quick Status',
    category: 'Docker',
    command: 'docker ps --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
    description: 'Formatted view of running docker containers'
  },
  {
    id: 'snip-6',
    title: 'Active Listening Ports',
    category: 'Network',
    command: 'ss -tulpn | grep LISTEN',
    description: 'List all open TCP and UDP listening ports and processes'
  },
  {
    id: 'snip-7',
    title: 'Clean Apt Cache & Temp Files',
    category: 'Maintenance',
    command: 'sudo apt-get clean && sudo apt-get autoremove -y',
    description: 'Free up disk space from package caches'
  },
  {
    id: 'snip-8',
    title: 'Live System Log Follow',
    category: 'Logs',
    command: 'journalctl -f -n 50',
    description: 'Follow systemd journal logs live'
  }
];

class StorageService {
  constructor() {
    this.ensureDataDir();
    this.data = this.load();
  }

  ensureDataDir() {
    if (!fs.existsSync(CONFIG.DATA_DIR)) {
      fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
    }
  }

  load() {
    try {
      if (fs.existsSync(CONFIG.STORAGE_FILE)) {
        const raw = fs.readFileSync(CONFIG.STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          hosts: parsed.hosts || [],
          snippets: parsed.snippets || DEFAULT_SNIPPETS,
          tunnels: parsed.tunnels || [],
          settings: {
            theme: 'cyberpunk',
            fontSize: 14,
            cursorBlink: true,
            scrollback: 5000,
            sftpShowHidden: true,
            ...parsed.settings
          }
        };
      }
    } catch (e) {
      console.warn('Failed to load storage, initializing fresh:', e.message);
    }

    const initial = {
      hosts: [],
      snippets: DEFAULT_SNIPPETS,
      tunnels: [],
      settings: {
        theme: 'cyberpunk',
        fontSize: 14,
        cursorBlink: true,
        scrollback: 5000,
        sftpShowHidden: true
      }
    };
    this.saveData(initial);
    return initial;
  }

  saveData(data = this.data) {
    try {
      this.ensureDataDir();
      const tempPath = `${CONFIG.STORAGE_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, CONFIG.STORAGE_FILE);
    } catch (err) {
      console.error('Failed to save storage:', err);
    }
  }

  // Hosts
  getHosts() {
    return this.data.hosts.map(h => ({
      ...h,
      // Mask password and privateKey for client security
      hasPassword: Boolean(h.password),
      hasPrivateKey: Boolean(h.privateKey),
      password: '',
      privateKey: ''
    }));
  }

  getHostRaw(id) {
    const host = this.data.hosts.find(h => h.id === id);
    if (!host) return null;
    return {
      ...host,
      password: host.password ? decrypt(host.password) : '',
      privateKey: host.privateKey ? decrypt(host.privateKey) : '',
      passphrase: host.passphrase ? decrypt(host.passphrase) : ''
    };
  }

  saveHost(hostData) {
    const id = hostData.id || `host-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const existingIndex = this.data.hosts.findIndex(h => h.id === id);

    let password = '';
    let privateKey = '';
    let passphrase = '';

    if (existingIndex >= 0) {
      const existing = this.data.hosts[existingIndex];
      password = hostData.password ? encrypt(hostData.password) : existing.password;
      privateKey = hostData.privateKey ? encrypt(hostData.privateKey) : existing.privateKey;
      passphrase = hostData.passphrase ? encrypt(hostData.passphrase) : existing.passphrase;
    } else {
      password = hostData.password ? encrypt(hostData.password) : '';
      privateKey = hostData.privateKey ? encrypt(hostData.privateKey) : '';
      passphrase = hostData.passphrase ? encrypt(hostData.passphrase) : '';
    }

    const record = {
      id,
      name: hostData.name || hostData.host,
      host: hostData.host,
      port: parseInt(hostData.port || '22', 10),
      username: hostData.username || 'root',
      authType: hostData.authType || 'password', // 'password' | 'privateKey'
      password,
      privateKey,
      passphrase,
      tags: Array.isArray(hostData.tags) ? hostData.tags : [],
      color: hostData.color || '#3b82f6',
      createdAt: hostData.createdAt || new Date().toISOString(),
      lastConnected: hostData.lastConnected || null
    };

    if (existingIndex >= 0) {
      this.data.hosts[existingIndex] = record;
    } else {
      this.data.hosts.push(record);
    }

    this.saveData();
    return this.getHostRaw(id);
  }

  updateHostLastConnected(id) {
    const host = this.data.hosts.find(h => h.id === id);
    if (host) {
      host.lastConnected = new Date().toISOString();
      this.saveData();
    }
  }

  deleteHost(id) {
    this.data.hosts = this.data.hosts.filter(h => h.id !== id);
    this.data.tunnels = this.data.tunnels.filter(t => t.hostId !== id);
    this.saveData();
    return true;
  }

  // Snippets
  getSnippets() {
    return this.data.snippets;
  }

  saveSnippet(snippetData) {
    const id = snippetData.id || `snip-${Date.now()}`;
    const index = this.data.snippets.findIndex(s => s.id === id);
    const item = {
      id,
      title: snippetData.title || 'Untitled Snippet',
      category: snippetData.category || 'General',
      command: snippetData.command || '',
      description: snippetData.description || ''
    };
    if (index >= 0) {
      this.data.snippets[index] = item;
    } else {
      this.data.snippets.unshift(item);
    }
    this.saveData();
    return item;
  }

  deleteSnippet(id) {
    this.data.snippets = this.data.snippets.filter(s => s.id !== id);
    this.saveData();
    return true;
  }

  // Tunnels
  getTunnels() {
    return this.data.tunnels;
  }

  saveTunnel(tunnelData) {
    const id = tunnelData.id || `tun-${Date.now()}`;
    const index = this.data.tunnels.findIndex(t => t.id === id);
    const item = {
      id,
      hostId: tunnelData.hostId,
      name: tunnelData.name || 'SSH Tunnel',
      type: tunnelData.type || 'local', // 'local' (forwardOut) or 'remote' (forwardIn)
      localPort: parseInt(tunnelData.localPort, 10),
      remoteHost: tunnelData.remoteHost || '127.0.0.1',
      remotePort: parseInt(tunnelData.remotePort, 10),
      autoStart: Boolean(tunnelData.autoStart)
    };
    if (index >= 0) {
      this.data.tunnels[index] = item;
    } else {
      this.data.tunnels.push(item);
    }
    this.saveData();
    return item;
  }

  deleteTunnel(id) {
    this.data.tunnels = this.data.tunnels.filter(t => t.id !== id);
    this.saveData();
    return true;
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData();
    return this.data.settings;
  }
}

export const storage = new StorageService();
