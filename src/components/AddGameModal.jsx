import { useState } from 'react';
import { Check, Copy, Download, Plus, X } from 'lucide-react';
import {
  serializeCatalogJson,
  validateNewGameInput,
} from '../utils/iframeCatalog.js';

const INITIAL_DRAFT = {
  title: '',
  category: 'Arcade',
  controls: '',
  description: '',
  iframeInput: '',
};

export function AddGameModal({
  isOpen,
  initialTab = 'add',
  games,
  onClose,
  onAddGame,
}) {
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const catalogJson = serializeCatalogJson(games);

  const handleSubmit = (e) => {
    e.preventDefault();
    const existingIds = new Set(games.map((g) => g.id));
    const result = validateNewGameInput(draft, existingIds);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    onAddGame(result.entry);
    setDraft(INITIAL_DRAFT);
    setErrors({});
    onClose();
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(catalogJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard optional in restricted contexts
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([catalogJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'games.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#2D3548] bg-[#161A23] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#252B3B] px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 id="modal-heading" className="font-display text-lg font-bold text-[#F4F4F5]">
              Iframe JSON Catalog
            </h2>
            <div className="flex items-center gap-1 rounded-lg bg-[#0F1117] p-1">
              <button
                type="button"
                onClick={() => setTab('add')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'add'
                    ? 'bg-[#252B3B] text-[#F4F4F5]'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                Add Iframe Game
              </button>
              <button
                type="button"
                onClick={() => setTab('json')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'json'
                    ? 'bg-[#252B3B] text-[#F4F4F5]'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                games.json ({games.length})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2D3548] bg-[#1D222E] text-[#A1A1AA] hover:text-[#F4F4F5] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {tab === 'add' ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="game-title" className="block text-xs font-medium text-[#D4D4D8]">
                  Game Title
                </label>
                <input
                  id="game-title"
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Retro Pong"
                  className="w-full rounded-lg border border-[#2D3548] bg-[#0F1117] px-3 py-2 text-sm text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#FF5A36] focus:outline-none"
                />
                {errors.title && (
                  <p className="text-xs text-red-400" role="alert">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="game-category" className="block text-xs font-medium text-[#D4D4D8]">
                  Category
                </label>
                <select
                  id="game-category"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="w-full rounded-lg border border-[#2D3548] bg-[#0F1117] px-3 py-2 text-sm text-[#F4F4F5] focus:border-[#FF5A36] focus:outline-none"
                >
                  <option value="Arcade">Arcade</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="Action">Action</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="game-controls" className="block text-xs font-medium text-[#D4D4D8]">
                Controls
              </label>
              <input
                id="game-controls"
                type="text"
                value={draft.controls}
                onChange={(e) => setDraft({ ...draft, controls: e.target.value })}
                placeholder="e.g. W / S or Arrow Keys"
                className="w-full rounded-lg border border-[#2D3548] bg-[#0F1117] px-3 py-2 text-sm text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#FF5A36] focus:outline-none"
              />
              {errors.controls && (
                <p className="text-xs text-red-400" role="alert">
                  {errors.controls}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="game-iframe" className="block text-xs font-medium text-[#D4D4D8]">
                Iframe HTML or Game URL
              </label>
              <textarea
                id="game-iframe"
                rows={2}
                value={draft.iframeInput}
                onChange={(e) => setDraft({ ...draft, iframeInput: e.target.value })}
                placeholder='<iframe src="/games/snake/index.html" title="My Game"></iframe>'
                className="w-full rounded-lg border border-[#2D3548] bg-[#0F1117] px-3 py-2 font-mono text-xs text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#FF5A36] focus:outline-none"
              />
              {errors.iframeInput && (
                <p className="text-xs text-red-400" role="alert">
                  {errors.iframeInput}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="game-description" className="block text-xs font-medium text-[#D4D4D8]">
                Short Description (optional)
              </label>
              <input
                id="game-description"
                type="text"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Brief summary of gameplay"
                className="w-full rounded-lg border border-[#2D3548] bg-[#0F1117] px-3 py-2 text-sm text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#FF5A36] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#2D3548] bg-[#1D222E] px-4 py-2 text-sm font-medium text-[#E4E4E7] hover:bg-[#252C3B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff6d4d] cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add to Catalog</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#A1A1AA]">
                Each game entry stores its <code className="font-mono text-[#E4E4E7]">iframe</code> tag in JSON.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D3548] bg-[#1D222E] px-3 py-1.5 text-xs font-medium text-[#E4E4E7] hover:bg-[#252C3B] cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5A36] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#ff6d4d] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Download games.json</span>
                </button>
              </div>
            </div>

            <pre className="max-h-80 overflow-auto rounded-lg border border-[#252B3B] bg-[#0B0D13] p-4 font-mono text-xs leading-relaxed text-[#D4D4D8]">
              {catalogJson}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
