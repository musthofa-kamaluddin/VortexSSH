const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ success: false, error: 'Invalid JSON response' }));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Hosts
  getHosts: () => request('/hosts'),
  saveHost: (hostData) => request('/hosts', { method: 'POST', body: JSON.stringify(hostData) }),
  deleteHost: (id) => request(`/hosts/${id}`, { method: 'DELETE' }),
  testHost: (hostData) => request('/hosts/test', { method: 'POST', body: JSON.stringify(hostData) }),
  connectHost: (payload) => request('/hosts/connect', { method: 'POST', body: JSON.stringify(payload) }),
  getSessions: () => request('/hosts/sessions'),
  disconnectSession: (sessionId) => request(`/hosts/sessions/${sessionId}/disconnect`, { method: 'POST' }),

  // SFTP
  listSftp: (sessionId, path) => request(`/sftp/list?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path || '.')}`),
  readSftp: (sessionId, path) => request(`/sftp/read?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path)}`),
  writeSftp: (sessionId, path, content) => request('/sftp/write', {
    method: 'POST',
    body: JSON.stringify({ sessionId, path, content })
  }),
  mkdirSftp: (sessionId, path) => request('/sftp/mkdir', {
    method: 'POST',
    body: JSON.stringify({ sessionId, path })
  }),
  deleteSftp: (sessionId, path, isDirectory) => request('/sftp/delete', {
    method: 'POST',
    body: JSON.stringify({ sessionId, path, isDirectory })
  }),
  renameSftp: (sessionId, oldPath, newPath) => request('/sftp/rename', {
    method: 'POST',
    body: JSON.stringify({ sessionId, oldPath, newPath })
  }),
  chmodSftp: (sessionId, path, mode) => request('/sftp/chmod', {
    method: 'POST',
    body: JSON.stringify({ sessionId, path, mode })
  }),
  getDownloadUrl: (sessionId, path) => `${API_BASE}/sftp/download?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path)}`,
  uploadSftp: async (sessionId, targetDir, file) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('targetDir', targetDir);
    formData.append('file', file);
    return request('/sftp/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Tunnels
  getTunnels: () => request('/tunnels'),
  saveTunnel: (tunnelData) => request('/tunnels', { method: 'POST', body: JSON.stringify(tunnelData) }),
  deleteTunnel: (id) => request(`/tunnels/${id}`, { method: 'DELETE' }),
  startTunnel: (id) => request(`/tunnels/${id}/start`, { method: 'POST' }),
  stopTunnel: (id) => request(`/tunnels/${id}/stop`, { method: 'POST' }),

  // Snippets
  getSnippets: () => request('/snippets'),
  saveSnippet: (snippetData) => request('/snippets', { method: 'POST', body: JSON.stringify(snippetData) }),
  deleteSnippet: (id) => request(`/snippets/${id}`, { method: 'DELETE' }),

  // Metrics
  getMetrics: (sessionId) => request(`/metrics/${sessionId}`),
  killProcess: (sessionId, pid, signal) => request(`/metrics/${sessionId}/kill`, {
    method: 'POST',
    body: JSON.stringify({ pid, signal })
  }),
  getSettings: () => request('/metrics/config/settings'),
  updateSettings: (settings) => request('/metrics/config/settings', {
    method: 'POST',
    body: JSON.stringify(settings)
  })
};
