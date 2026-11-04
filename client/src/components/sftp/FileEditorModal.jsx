import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useSsh } from '../../context/SshContext';
import { Save, X, FileCode, Check, AlertTriangle, Loader2 } from 'lucide-react';

export function FileEditorModal({ sessionId, filePath, onClose }) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useSsh();

  const isDirty = content !== originalContent;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await api.readSftp(sessionId, filePath);
        setContent(res.content);
        setOriginalContent(res.content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, filePath]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.writeSftp(sessionId, filePath, content);
      setOriginalContent(content);
      addToast(`Saved ${filePath.split('/').pop()} successfully`, 'success');
    } catch (err) {
      addToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard and close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const linesCount = content.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div 
        className="w-full max-w-5xl h-[85vh] bg-vortex-850 rounded-xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Editor Header */}
        <div className="h-12 bg-vortex-800 px-4 flex items-center justify-between border-b border-slate-700/80">
          <div className="flex items-center gap-2.5 truncate">
            <FileCode className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="font-mono text-sm text-slate-100 font-medium truncate">{filePath}</span>
            {isDirty && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                Unsaved Changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline mr-2">
              {linesCount} lines • Ctrl+S to save
            </span>

            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isDirty
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-vortex-900 select-text">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm">Reading file from remote server...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-rose-400 p-8 text-center">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm max-w-md">{error}</p>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              autoFocus
              className="w-full h-full p-4 font-mono text-sm leading-relaxed text-slate-200 bg-transparent resize-none focus:outline-none focus:ring-0 select-text"
              placeholder="File is empty"
            />
          )}
        </div>
      </div>
    </div>
  );
}
