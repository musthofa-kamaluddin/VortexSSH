import React, { useState } from 'react';
import { useSsh } from '../../context/SshContext';
import { api } from '../../utils/api';
import { 
  Server, 
  Key, 
  Lock, 
  X, 
  Eye, 
  EyeOff, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

export function HostManagerModal({ isOpen, onClose, initialHost = null }) {
  const { refreshHosts, connectToHost, addToast } = useSsh();

  const [id, setId] = useState(initialHost?.id || '');
  const [name, setName] = useState(initialHost?.name || '');
  const [host, setHost] = useState(initialHost?.host || '');
  const [port, setPort] = useState(initialHost?.port || 22);
  const [username, setUsername] = useState(initialHost?.username || 'root');
  const [authType, setAuthType] = useState(initialHost?.authType || 'password');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [tagsInput, setTagsInput] = useState(initialHost?.tags ? initialHost.tags.join(', ') : '');
  const [color, setColor] = useState(initialHost?.color || '#3b82f6');

  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!host || !username) {
      addToast('Host and username are required', 'warning');
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testHost({
        id,
        host,
        port: parseInt(port, 10),
        username,
        authType,
        password,
        privateKey,
        passphrase
      });
      setTestResult({ success: true, message: res.os || 'Connected successfully!' });
      addToast('Connection successful', 'success');
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      addToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (andConnect = false) => {
    if (!host || !username) {
      addToast('Host and username are required', 'warning');
      return;
    }
    try {
      setSaving(true);
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const savedHost = await api.saveHost({
        id: id || undefined,
        name: name || host,
        host,
        port: parseInt(port, 10),
        username,
        authType,
        password,
        privateKey,
        passphrase,
        tags,
        color
      });

      addToast('Host profile saved', 'success');
      await refreshHosts();

      if (andConnect) {
        onClose();
        await connectToHost(savedHost.host.id);
      } else {
        onClose();
      }
    } catch (err) {
      addToast(`Save error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-zinc-900 rounded border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="h-12 bg-zinc-900 px-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-zinc-100">
              {id ? 'Edit Connection Profile' : 'New SSH Connection'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Name & Host & Port */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-400 block mb-1">Connection Label</label>
              <input
                type="text"
                placeholder="e.g. Ubuntu Web Server"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Badge Color</label>
              <div className="flex items-center gap-2 pt-1">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-zinc-400' : 'opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-zinc-400 block mb-1">Host / IP Address *</label>
              <input
                type="text"
                placeholder="192.168.1.100 or server.com"
                value={host}
                onChange={e => setHost(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Port *</label>
              <input
                type="number"
                placeholder="22"
                value={port}
                onChange={e => setPort(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">Username *</label>
            <input
              type="text"
              placeholder="ubuntu, root, or user"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Authentication Type Switcher */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-2">Authentication Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAuthType('password')}
                className={`py-1.5 px-3 rounded border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  authType === 'password'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthType('privateKey')}
                className={`py-1.5 px-3 rounded border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                  authType === 'privateKey'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Private Key</span>
              </button>
            </div>
          </div>

          {/* Password Field */}
          {authType === 'password' && (
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">
                Password {id && <span className="text-[10px] text-zinc-500">(Leave blank to keep existing)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter SSH password..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-3 pr-9 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Private Key Fields */}
          {authType === 'privateKey' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">
                  Private Key (OpenSSH / PEM)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  value={privateKey}
                  onChange={e => setPrivateKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">
                  Passphrase (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Passphrase if encrypted"
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. production, aws, database"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-zinc-950 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-950 border-rose-500/40 text-rose-400'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span className="truncate">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="h-14 bg-zinc-900 px-5 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium transition-colors border border-zinc-700/60"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-blue-400" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors"
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
