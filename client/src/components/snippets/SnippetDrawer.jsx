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
  Code2 
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

  // New snippet form state
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
      s.command.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
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
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col select-none animate-slide-left">
      {/* Header */}
      <div className="h-13 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-100">Snippet Library</h2>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
            {snippets.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAddOpen(true)}
            title="Create Custom Snippet"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSnippetDrawerOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 border-b border-zinc-800 flex flex-col gap-2 bg-zinc-950">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search commands or descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] rounded whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-medium'
                  : 'bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-zinc-900">
        {filteredSnippets.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No matching snippets found
          </div>
        ) : (
          filteredSnippets.map(snip => (
            <div
              key={snip.id}
              className="bg-zinc-950 p-3 rounded border border-zinc-800 hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200">{snip.title}</h3>
                  {snip.description && (
                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{snip.description}</p>
                  )}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono tracking-wider shrink-0 border border-zinc-800">
                  {snip.category}
                </span>
              </div>

              {/* Command Box */}
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80 my-2 font-mono text-[11px] text-blue-400 break-all select-text">
                {snip.command}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleDelete(snip.id, snip.title)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-opacity p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(snip)}
                    title="Copy command"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[11px] transition-colors border border-zinc-750"
                  >
                    {copiedId === snip.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>

                  <button
                    onClick={() => handleRun(snip)}
                    title="Execute directly in active terminal"
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-zinc-900 p-5 rounded border border-zinc-800 shadow-2xl flex flex-col gap-3.5"
          >
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span>New Snippet</span>
            </h3>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. Restart Nginx & Check Syntax"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Docker, Nginx, System"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Command String</label>
              <textarea
                rows={3}
                placeholder="sudo nginx -t && sudo systemctl reload nginx"
                value={command}
                onChange={e => setCommand(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-blue-400 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief summary of what this command executes"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
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
