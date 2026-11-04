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
  Loader2, 
  Trash2, 
  Tag, 
  Sparkles 
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
      addToast('Connection successful!', 'success');
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

  const fillLocalDemo = () => {
    setName('Local Demo Server');
    setHost('127.0.0.1');
    setPort(2222);
    setUsername('vortex');
    setAuthType('password');
    setPassword('vortexpass123');
    setTagsInput('mock, demo, testing');
    setColor('#06b6d4');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-vortex-850 rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="h-14 bg-vortex-800 px-6 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {id ? 'Edit Connection Profile' : 'New SSH Connection'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!id && (
              <button
                type="button"
                onClick={fillLocalDemo}
                title="Fill with Local Mock Server credentials"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Local Demo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Name & Host & Port */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1">Server Profile Name</label>
              <input
                type="text"
                placeholder="e.g. Production Cluster Node 1"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Badge Color</label>
              <div className="flex items-center gap-2 pt-1">
                {['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1">Hostname or IP Address *</label>
              <input
                type="text"
                placeholder="192.168.1.100 or ssh.example.com"
                value={host}
                onChange={e => setHost(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Port *</label>
              <input
                type="number"
                placeholder="22"
                value={port}
                onChange={e => setPort(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Username *</label>
            <input
              type="text"
              placeholder="root, ubuntu, or user"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Authentication Type Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">Authentication Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAuthType('password')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  authType === 'password'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthType('privateKey')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  authType === 'privateKey'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Private Key (SSH Key)</span>
              </button>
            </div>
          </div>

          {/* Password Field */}
          {authType === 'password' && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Password {id && <span className="text-[10px] text-slate-500">(Leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter SSH password..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Private Key Fields */}
          {authType === 'privateKey' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Private Key (OpenSSH / PEM format)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  value={privateKey}
                  onChange={e => setPrivateKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Passphrase (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Private key passphrase if protected"
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. aws, staging, database, europe"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Test Connection Banner */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span className="truncate">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="h-16 bg-vortex-800 px-6 border-t border-slate-700/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Save Profile
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
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
