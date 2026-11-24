import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header.jsx';
import { GameCard } from './components/GameCard.jsx';
import { GamePlayerStage } from './components/GamePlayerStage.jsx';
import { AddGameModal } from './components/AddGameModal.jsx';
import { withCacheBuster } from './utils/iframeCatalog.js';

const CUSTOM_GAMES_KEY = 'recess_arcade_custom_games_v1';

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

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeGameId, setActiveGameId] = useState(() => {
    return new URLSearchParams(window.location.search).get('game');
  });
  const [bgSrc, setBgSrc] = useState('./assets/aistudio/978570_9108268c.jpg');
  const [modalState, setModalState] = useState({
    open: false,
    tab: 'add',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const bust = Date.now();
        let res = await fetch(withCacheBuster('./games.json', bust), {
          cache: 'no-store',
        });
        let fromPublicDir = false;
        if (!res.ok) {
          res = await fetch(withCacheBuster('./public/games.json', bust), {
            cache: 'no-store',
          });
          fromPublicDir = true;
        }
        if (!res.ok) {
          throw new Error(`Failed to load games.json (${res.status})`);
        }
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? fromPublicDir
            ? data.map((item) => ({
                ...item,
                thumbnail: item.thumbnail
                  ? String(item.thumbnail).replace(/^\.?\/assets\//i, './public/assets/')
                  : item.thumbnail,
                iframe: String(item.iframe || '').replace(
                  /src=(["'])\.?\/games\//gi,
                  'src=$1./public/games/'
                ),
              }))
            : data
          : [];
        if (!cancelled) {
          setBaseGames(normalized);
          setLoadError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load games catalog.');
          setLoading(false);
        }
      }
    }

    loadCatalog();

    const handlePageShow = (event) => {
      if (event.persisted) {
        loadCatalog();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCatalog();
      }
    };

    const handleStorage = (event) => {
      if (event.key !== CUSTOM_GAMES_KEY) return;
      try {
        setCustomGames(event.newValue ? JSON.parse(event.newValue) : []);
      } catch {
        // Ignore malformed storage data
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const allGames = useMemo(() => [...baseGames, ...customGames], [baseGames, customGames]);

  const activeGame = useMemo(
    () => allGames.find((g) => g.id === activeGameId) ?? null,
    [allGames, activeGameId]
  );

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

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0F1117] text-[#F4F4F5]">
      <img
        src={bgSrc}
        alt=""
        aria-hidden="true"
        data-testid="site-background"
        referrerPolicy="no-referrer"
        onError={() => {
          if (bgSrc !== './public/assets/aistudio/978570_9108268c.jpg') {
            setBgSrc('./public/assets/aistudio/978570_9108268c.jpg');
          }
        }}
        className="pointer-events-none fixed inset-0 z-0 h-full w-full select-none object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[#0B0E17]/35"
      />

      <Header
        onOpenAddModal={() => setModalState({ open: true, tab: 'add' })}
        onOpenJsonModal={() => setModalState({ open: true, tab: 'json' })}
        onGoHome={() => selectGame(null)}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-[#161A23]" aria-busy="true" />
        ) : loadError ? (
          <div className="rounded-xl border border-red-500/40 bg-[#161A23] p-8 text-center">
            <h1 className="font-display text-xl font-bold text-[#F4F4F5]">
              Could not load games.json
            </h1>
            <p className="mt-2 text-sm text-[#A1A1AA]">{loadError}</p>
          </div>
        ) : activeGame ? (
          <GamePlayerStage game={activeGame} onBack={() => selectGame(null)} />
        ) : allGames.length === 0 ? (
          <div
            data-testid="empty-catalog"
            className="rounded-xl border border-[#252B3B] bg-[#161A23] p-12 text-center space-y-4"
          >
            <h1 className="font-display text-2xl font-bold text-[#F4F4F5]">
              No games in catalog
            </h1>
            <p className="mx-auto max-w-md text-sm text-[#A1A1AA]">
              Add game iframe entries to <code className="font-mono text-[#E4E4E7]">games.json</code> or use Add Game to embed one now.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setModalState({ open: true, tab: 'add' })}
                className="rounded-lg bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff6d4d] cursor-pointer"
              >
                Add Game
              </button>
              <button
                type="button"
                onClick={() => setModalState({ open: true, tab: 'json' })}
                className="rounded-lg border border-[#2D3548] bg-[#1D222E] px-4 py-2 text-sm font-medium text-[#E4E4E7] hover:bg-[#252C3B] cursor-pointer"
              >
                View games.json
              </button>
            </div>
          </div>
        ) : (
          <div
            data-testid="game-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {allGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPlay={selectGame}
                onRemoveCustom={handleRemoveCustom}
              />
            ))}
          </div>
        )}
      </main>

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
