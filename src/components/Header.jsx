import { useState } from 'react';
import { Menu, Shuffle, X } from 'lucide-react';

const NAV_CATEGORIES = [
  { label: 'All Games', value: 'All' },
  { label: 'Arcade', value: 'Arcade' },
  { label: 'Puzzle', value: 'Puzzle' },
  { label: 'Action', value: 'Action' },
];

export function Header({
  activeCategory,
  onSelectCategory,
  onOpenAddModal,
  onLaunchRandom,
  onGoHome,
  hasGames,
  isPlayingView,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (value) => {
    onSelectCategory(value);
    onGoHome();
    setMobileMenuOpen(false);
  };

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

        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {NAV_CATEGORIES.map((item) => {
            const isActive = !isPlayingView && activeCategory === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleCategoryClick(item.value)}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5A36] ${
                  isActive
                    ? 'border-[#FF5A36] text-[#F4F4F5]'
                    : 'border-transparent text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAddModal();
            }}
            className="text-sm font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 border-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5A36]"
          >
            Add Game
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onLaunchRandom}
            disabled={!hasGames}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff6d4d] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            <span>Random Game</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#252B3B] bg-[#161A23] text-[#F4F4F5] md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          className="border-t border-[#252B3B] bg-[#161A23] px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-wrap items-center gap-2">
            {NAV_CATEGORIES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleCategoryClick(item.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  activeCategory === item.value
                    ? 'bg-[#FF5A36] text-white'
                    : 'bg-[#0F1117] text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAddModal();
              }}
              className="rounded-lg bg-[#0F1117] px-3 py-2 text-sm font-medium text-[#A1A1AA] hover:text-[#F4F4F5] whitespace-nowrap"
            >
              Add Game
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
