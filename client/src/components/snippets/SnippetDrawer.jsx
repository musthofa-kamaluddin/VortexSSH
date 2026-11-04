import React, { useState, useEffect } from 'react';
import { useSsh } from '../../context/SshContext';
import { api } from '../../utils/api';
import { 
  Zap, 
  Play, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Code2, 
  Terminal 
} from 'lucide-react';

export function SnippetDrawer() {
  const { 
    isSnippetDrawerOpen, 
    setIsSnippetDrawerOpen, 
    sendToTerminal, 
    addToast,
    activeTab,
    setActiveTab
  } = useSsh();

  const [snippets, setSnippets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New snippet state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [command, setCommand] = useState('');
  const [description, setDescription] = useState('');

  const fetchSnippets = async () => {
    try {
      const res = await api.getSnippets();
      setSnippets(res.snippets || []);
    } catch (err) {
      console.warn('Failed to load snippets:', err.message);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const categories = ['All', ...new Set(snippets.map(s => s.category).filter(Boolean))];

  const filteredSnippets = snippets
    .filter(s => selectedCategory === 'All' || s.category === selectedCategory)
    .filter(s => 
      s.title.toLowerCase().includes(search.toLowerCase()) || 
      s.command.toLowerCase().includes(search.toLowerCase())
    );

  const handleRun = (snip) => {
    if (activeTab !== 'terminal') {
      setActiveTab('terminal');
    }
    sendToTerminal(snip.command);
  };

  const handleCopy = (snip) => {
    navigator.clipboard.writeText(snip.command);
    setCopiedId(snip.id);
    addToast('Command copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete snippet "${title}"?`)) return;
    try {
      await api.deleteSnippet(id);
      addToast('Snippet deleted', 'info');
      fetchSnippets();
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !command) return;
    try {
      await api.saveSnippet({ title, category, command, description });
      addToast('Snippet saved', 'success');
      setIsAddOpen(false);
      setTitle('');
      setCommand('');
      setDescription('');
      fetchSnippets();
    } catch (err) {
      addToast(`Save failed: ${err.message}`, 'error');
    }
  };

  if (!isSnippetDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-vortex-850/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col select-none animate-slide-left">
      {/* Header */}
      <div className="h-14 px-4 bg-vortex-800 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Snippet Library</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
            {snippets.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAddOpen(true)}
            title="Create Custom Snippet"
            className="p-1.5 text-slate-300 hover:text-cyan-400 rounded hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSnippetDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 border-b border-slate-800 flex flex-col gap-2 bg-vortex-900/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {filteredSnippets.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No snippets found
          </div>
        ) : (
          filteredSnippets.map(snip => (
            <div
              key={snip.id}
              className="glass-panel p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">{snip.title}</h3>
                  {snip.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">{snip.description}</p>
                  )}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                  {snip.category}
                </span>
              </div>

              {/* Command Preview */}
              <div className="bg-vortex-900 p-2 rounded border border-slate-800/80 my-2 font-mono text-[11px] text-cyan-300 break-all select-text">
                {snip.command}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleDelete(snip.id, snip.title)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(snip)}
                    title="Copy command"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                  >
                    {copiedId === snip.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>

                  <button
                    onClick={() => handleRun(snip)}
                    title="Execute directly into active terminal"
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all shadow-sm shadow-indigo-600/30"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Snippet Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-vortex-850 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col gap-4"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Create New Snippet</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Snippet Title</label>
              <input
                type="text"
                placeholder="e.g. Restart Nginx & Test Config"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Nginx, Docker, Maintenance"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Command String</label>
              <textarea
                rows={3}
                placeholder="nginx -t && systemctl reload nginx"
                value={command}
                onChange={e => setCommand(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="Short note about what this script does"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md"
              >
                Save Snippet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
