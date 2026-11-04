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
  // System & Hardware
  {
    id: 'snip-1',
    title: 'System & OS Summary',
    category: 'System',
    command: 'uname -srm && cat /etc/os-release | grep PRETTY_NAME && uptime -p',
    description: 'Kernel version, OS distribution name, and system uptime'
  },
  {
    id: 'snip-2',
    title: 'CPU Hardware Specifications',
    category: 'System',
    command: 'lscpu | grep -E "Model name|Socket|Thread|NUMA|CPU\\(s\\)|MHz"',
    description: 'Detailed CPU model, cores, frequency, and architecture'
  },
  {
    id: 'snip-3',
    title: 'Block Devices & Partition UUIDs',
    category: 'System',
    command: 'lsblk -o NAME,SIZE,FSTYPE,TYPE,MOUNTPOINT,UUID',
    description: 'Inspect physical disks, partitions, file systems, and mount paths'
  },

  // Storage & Disk
  {
    id: 'snip-4',
    title: 'Filesystem Disk Usage',
    category: 'Storage',
    command: 'df -hT -x tmpfs -x devtmpfs -x squashfs',
    description: 'Check mounted partition usage with filesystem types'
  },
  {
    id: 'snip-5',
    title: 'Top 10 Largest Directories in /var',
    category: 'Storage',
    command: 'du -ah -d 1 /var 2>/dev/null | sort -hr | head -n 11',
    description: 'Locate storage hogs inside the /var directory'
  },
  {
    id: 'snip-6',
    title: 'Find Files Larger Than 100MB',
    category: 'Storage',
    command: 'find / -type f -size +100M -exec ls -lh {} + 2>/dev/null | awk \'{print $5, $9}\'',
    description: 'Scan filesystem for files exceeding 100 megabytes'
  },
  {
    id: 'snip-7',
    title: 'Disk I/O Statistics',
    category: 'Storage',
    command: 'iostat -xz 1 3 2>/dev/null || vmstat 1 5',
    description: 'Check disk read/write throughput and I/O wait times'
  },

  // Memory & Processes
  {
    id: 'snip-8',
    title: 'Memory Usage Breakdown',
    category: 'Memory',
    command: 'free -h --wide',
    description: 'RAM, swap, buffers, and cache availability'
  },
  {
    id: 'snip-9',
    title: 'Top 10 RAM Consuming Processes',
    category: 'Memory',
    command: 'ps -eo pid,user,%mem,%cpu,comm --sort=-%mem | head -n 11',
    description: 'List processes with the highest memory consumption'
  },
  {
    id: 'snip-10',
    title: 'Top 10 CPU Consuming Processes',
    category: 'Memory',
    command: 'ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu | head -n 11',
    description: 'List processes consuming the most CPU power'
  },
  {
    id: 'snip-11',
    title: 'Check OOM-Killer Invocations',
    category: 'Memory',
    command: 'dmesg -T 2>/dev/null | grep -i -E "oom|out of memory|killed process" | tail -n 20',
    description: 'Review kernel logs for Out-Of-Memory process termination'
  },

  // Network & Connectivity
  {
    id: 'snip-12',
    title: 'Active TCP & UDP Listening Ports',
    category: 'Network',
    command: 'ss -tulpn | grep LISTEN',
    description: 'List open ports with process IDs and program names'
  },
  {
    id: 'snip-13',
    title: 'Network Interfaces & IP Addresses',
    category: 'Network',
    command: 'ip -c -br a',
    description: 'Brief colored list of network interfaces and assigned IPs'
  },
  {
    id: 'snip-14',
    title: 'Check External Public IP',
    category: 'Network',
    command: 'curl -s https://ifconfig.me || curl -s https://api.ipify.org',
    description: 'Query public outbound IP address from terminal'
  },
  {
    id: 'snip-15',
    title: 'Inspect Connections on Web Ports',
    category: 'Network',
    command: 'ss -tan state established "( dport = :80 or dport = :443 or sport = :80 or sport = :443 )"',
    description: 'View active HTTP/HTTPS connections'
  },

  // Docker & Containers
  {
    id: 'snip-16',
    title: 'Docker Container Table',
    category: 'Docker',
    command: 'docker ps --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
    description: 'List active Docker containers with names and port mappings'
  },
  {
    id: 'snip-17',
    title: 'Docker Live Resource Stats',
    category: 'Docker',
    command: 'docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"',
    description: 'One-time snapshot of CPU and memory used per container'
  },
  {
    id: 'snip-18',
    title: 'Docker Disk Space Usage',
    category: 'Docker',
    command: 'docker system df',
    description: 'View disk space used by images, containers, and volumes'
  },
  {
    id: 'snip-19',
    title: 'Clean Unused Docker Resources',
    category: 'Docker',
    command: 'docker system prune -f --volumes',
    description: 'Remove stopped containers, unused networks, and dangling images'
  },

  // Nginx & Web
  {
    id: 'snip-20',
    title: 'Test Nginx Config & Reload',
    category: 'Nginx',
    command: 'sudo nginx -t && sudo systemctl reload nginx',
    description: 'Safely validate configuration syntax before reloading Nginx'
  },
  {
    id: 'snip-21',
    title: 'Nginx Access Log Stream',
    category: 'Nginx',
    command: 'tail -n 30 -f /var/log/nginx/access.log 2>/dev/null',
    description: 'Follow live incoming web requests'
  },
  {
    id: 'snip-22',
    title: 'Nginx Error Log',
    category: 'Nginx',
    command: 'tail -n 30 /var/log/nginx/error.log 2>/dev/null',
    description: 'Check latest Nginx error logs'
  },

  // Systemd & Services
  {
    id: 'snip-23',
    title: 'List All Failed Services',
    category: 'Systemd',
    command: 'systemctl list-units --state=failed',
    description: 'Find broken background services and crash reports'
  },
  {
    id: 'snip-24',
    title: 'Follow Systemd Journal Logs',
    category: 'Systemd',
    command: 'journalctl -f -n 50',
    description: 'Stream live unified system logs'
  },
  {
    id: 'snip-25',
    title: 'Critical System Error Logs',
    category: 'Systemd',
    command: 'journalctl -p 3 -xb -n 30',
    description: 'View the 30 most recent error/critical entries from current boot'
  },

  // Security & Authentication
  {
    id: 'snip-26',
    title: 'Recent Failed SSH Logins',
    category: 'Security',
    command: 'grep "Failed password" /var/log/auth.log 2>/dev/null | tail -n 20 || journalctl -u ssh --grep="Failed password" -n 20',
    description: 'Inspect potential brute-force attempts'
  },
  {
    id: 'snip-27',
    title: 'Firewall (UFW) Status & Rules',
    category: 'Security',
    command: 'sudo ufw status verbose 2>/dev/null || sudo iptables -L -n -v',
    description: 'Check active firewall rules and incoming port policies'
  },
  {
    id: 'snip-28',
    title: 'Recent User Logins',
    category: 'Security',
    command: 'last -n 15',
    description: 'Show recent login history and session durations'
  },

  // Maintenance
  {
    id: 'snip-29',
    title: 'Apt Update & Check Upgradeable',
    category: 'Maintenance',
    command: 'sudo apt update && apt list --upgradable',
    description: 'Refresh package indices and list pending security updates'
  },
  {
    id: 'snip-30',
    title: 'Vacuum Journal Logs (Keep 3 Days)',
    category: 'Maintenance',
    command: 'sudo journalctl --vacuum-time=3d',
    description: 'Free up disk space consumed by old systemd log archives'
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

        // Filter out any mock/local test hosts
        const cleanHosts = (parsed.hosts || []).filter(h => 
          !h.name?.toLowerCase().includes('mock') &&
          !h.tags?.includes('testing') &&
          h.port !== 2222
        );

        // Merge snippets so new default snippets are always available
        const existingSnippets = parsed.snippets || [];
        const existingIds = new Set(existingSnippets.map(s => s.id));
        const mergedSnippets = [...existingSnippets];
        for (const snip of DEFAULT_SNIPPETS) {
          if (!existingIds.has(snip.id)) {
            mergedSnippets.push(snip);
          }
        }

        const data = {
          hosts: cleanHosts,
          snippets: mergedSnippets.length > 0 ? mergedSnippets : DEFAULT_SNIPPETS,
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
        this.saveData(data);
        return data;
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
