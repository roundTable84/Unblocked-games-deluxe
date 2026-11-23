import { Code2, Plus } from 'lucide-react';

export function Header({ onOpenAddModal, onOpenJsonModal, onGoHome }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#252B3B] bg-[#0F1117]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <a
          href="#library"
          onClick={(e) => {
            e.preventDefault();
            onGoHome();
          }}
          className="font-display text-lg font-bold tracking-tight text-[#F4F4F5] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5A36]"
        >
          Recess Arcade
        </a>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenJsonModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D3548] bg-[#161A23] px-3.5 py-2 text-xs font-medium text-[#E4E4E7] transition-colors hover:bg-[#222836] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>games.json</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff6d4d] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Game</span>
          </button>
        </div>
      </div>
    </header>
  );
}
