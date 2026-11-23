import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Header } from './components/Header.jsx';
import { FeaturedSpotlight } from './components/FeaturedSpotlight.jsx';
import { GameCard } from './components/GameCard.jsx';
import { GamePlayerStage } from './components/GamePlayerStage.jsx';
import { AddGameModal } from './components/AddGameModal.jsx';
import { filterGames } from './utils/iframeCatalog.js';

const FAVORITES_KEY = 'recess_arcade_favorites_v1';
const CUSTOM_GAMES_KEY = 'recess_arcade_custom_games_v1';

const FILTER_TABS = [
  { label: 'All', value: 'All' },
  { label: 'Arcade', value: 'Arcade' },
  { label: 'Puzzle', value: 'Puzzle' },
  { label: 'Action', value: 'Action' },
  { label: 'Favorites', value: 'Favorites' },
];

export default function App() {
  const [baseGames, setBaseGames] = useState([]);
  const [customGames, setCustomGames] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_GAMES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeGameId, setActiveGameId] = useState(() => {
    return new URLSearchParams(window.location.search).get('game');
  });
  const [modalState, setModalState] = useState({
    open: false,
    tab: 'add',
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/games.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load games.json (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setBaseGames(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load games catalog.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const allGames = useMemo(() => [...baseGames, ...customGames], [baseGames, customGames]);

  const filteredGames = useMemo(
    () => filterGames(allGames, searchQuery, activeCategory, favoriteIds),
    [allGames, searchQuery, activeCategory, favoriteIds]
  );

  const activeGame = useMemo(
    () => allGames.find((g) => g.id === activeGameId) ?? null,
    [allGames, activeGameId]
  );

  const featuredGame = allGames[0] ?? null;

  const selectGame = (game) => {
    const nextId = game ? game.id : null;
    setActiveGameId(nextId);
    const url = new URL(window.location.href);
    if (nextId) {
      url.searchParams.set('game', nextId);
    } else {
      url.searchParams.delete('game');
    }
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  };

  const handleAddGame = (entry) => {
    setCustomGames((prev) => {
      const next = [...prev, entry];
      try {
        localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  };

  const handleRemoveCustom = (id) => {
    setCustomGames((prev) => {
      const next = prev.filter((g) => g.id !== id);
      try {
        localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
    if (activeGameId === id) {
      selectGame(null);
    }
  };

  const handleLaunchRandom = () => {
    if (allGames.length === 0) return;
    const pool = activeGame ? allGames.filter((g) => g.id !== activeGame.id) : allGames;
    const source = pool.length > 0 ? pool : allGames;
    const picked = source[Math.floor(Math.random() * source.length)];
    selectGame(picked);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1117] text-[#F4F4F5]">
      <Header
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenAddModal={() => setModalState({ open: true, tab: 'add' })}
        onLaunchRandom={handleLaunchRandom}
        onGoHome={() => selectGame(null)}
        hasGames={allGames.length > 0}
        isPlayingView={Boolean(activeGame)}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="space-y-6" aria-busy="true">
            <div className="h-64 animate-pulse rounded-xl bg-[#161A23]" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-72 animate-pulse rounded-xl bg-[#161A23]" />
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-500/40 bg-[#161A23] p-8 text-center">
            <h1 className="font-display text-xl font-bold text-[#F4F4F5]">
              Could not load games catalog
            </h1>
            <p className="mt-2 text-sm text-[#A1A1AA]">{loadError}</p>
          </div>
        ) : activeGame ? (
          <GamePlayerStage
            game={activeGame}
            allGames={allGames}
            isFavorite={favoriteIds.has(activeGame.id)}
            onBack={() => selectGame(null)}
            onSelectGame={selectGame}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div id="library" className="space-y-8">
            {featuredGame && (
              <FeaturedSpotlight
                game={featuredGame}
                totalCount={allGames.length}
                onPlay={selectGame}
                onInspectJson={() => setModalState({ open: true, tab: 'json' })}
              />
            )}

            <section aria-label="Game catalog" className="space-y-5">
              <div className="flex flex-col gap-4 border-b border-[#252B3B] pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#161A23] p-1 border border-[#252B3B]">
                  {FILTER_TABS.map((tab) => {
                    const isActive = activeCategory === tab.value;
                    const countLabel =
                      tab.value === 'Favorites' ? ` (${favoriteIds.size})` : '';
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setActiveCategory(tab.value)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-[#FF5A36] text-white'
                            : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
                        }`}
                      >
                        {tab.label}
                        {countLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full md:w-72">
                  <label htmlFor="game-search" className="sr-only">
                    Search games
                  </label>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]"
                    aria-hidden="true"
                  />
                  <input
                    id="game-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search games or controls..."
                    className="w-full rounded-lg border border-[#252B3B] bg-[#161A23] py-2 pl-9 pr-9 text-sm text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#FF5A36] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#A1A1AA] hover:text-[#F4F4F5] cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {filteredGames.length === 0 ? (
                <div className="rounded-xl border border-[#252B3B] bg-[#161A23] p-10 text-center space-y-3">
                  <h2 className="font-display text-lg font-semibold text-[#F4F4F5]">
                    No matching games found
                  </h2>
                  <p className="text-sm text-[#A1A1AA]">
                    {activeCategory === 'Favorites'
                      ? 'Save a game with the heart button to see it here.'
                      : 'Try clearing your search or switching categories.'}
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center rounded-lg bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff6d4d] cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div
                  data-testid="game-grid"
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isFavorite={favoriteIds.has(game.id)}
                      onPlay={selectGame}
                      onToggleFavorite={toggleFavorite}
                      onRemoveCustom={handleRemoveCustom}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-[#252B3B] bg-[#0F1117] py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-[#A1A1AA] sm:px-6">
          <span>Recess Arcade · Built with HTML, CSS, JavaScript &amp; JSON Iframes</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setModalState({ open: true, tab: 'json' })}
              className="hover:text-[#F4F4F5] underline-offset-4 hover:underline cursor-pointer"
            >
              Inspect games.json
            </button>
            <button
              type="button"
              onClick={() => setModalState({ open: true, tab: 'add' })}
              className="hover:text-[#F4F4F5] underline-offset-4 hover:underline cursor-pointer"
            >
              Add Custom Iframe
            </button>
          </div>
        </div>
      </footer>

      <AddGameModal
        key={`${modalState.open}-${modalState.tab}`}
        isOpen={modalState.open}
        initialTab={modalState.tab}
        games={allGames}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        onAddGame={handleAddGame}
      />
    </div>
  );
}
