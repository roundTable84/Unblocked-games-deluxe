import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Heart,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { parseIframeEntry } from '../utils/iframeCatalog.js';

export function GamePlayerStage({
  game,
  allGames,
  isFavorite,
  onBack,
  onSelectGame,
  onToggleFavorite,
}) {
  const stageContainerRef = useRef(null);
  const iframeRef = useRef(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const parsed = useMemo(() => parseIframeEntry(game.iframe, game.title), [game.iframe, game.title]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [game.id, reloadNonce]);

  const handleFullscreen = async () => {
    const el = stageContainerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen may be restricted by parent sandbox; ignore silently
    }
  };

  const handleReload = () => {
    setReloadNonce((n) => n + 1);
  };

  const upNext = allGames.filter((g) => g.id !== game.id).slice(0, 4);

  return (
    <section aria-label={`${game.title} player`} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#252B3B] bg-[#161A23] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2D3548] bg-[#1D222E] px-3.5 py-2 text-sm font-medium text-[#F4F4F5] transition-colors hover:bg-[#252C3B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Library</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-display truncate text-lg font-bold text-[#F4F4F5] sm:text-xl">
              {game.title}
            </h1>
            <p className="truncate text-xs text-[#A1A1AA]">
              <span>{game.category}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>{game.controls}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReload}
            aria-label="Reload game"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D3548] bg-[#1D222E] px-3 py-2 text-xs font-medium text-[#E4E4E7] transition-colors hover:bg-[#252C3B] whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(game.id)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remove ${game.title} from favorites` : `Favorite ${game.title}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              isFavorite
                ? 'border-[#FF5A36]/60 bg-[#FF5A36]/15 text-[#FF5A36]'
                : 'border-[#2D3548] bg-[#1D222E] text-[#E4E4E7] hover:bg-[#252C3B]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{isFavorite ? 'Saved' : 'Favorite'}</span>
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Toggle fullscreen"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5A36] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#ff6d4d] whitespace-nowrap cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Fullscreen</span>
          </button>
        </div>
      </div>

      <div
        ref={stageContainerRef}
        className="relative w-full overflow-hidden rounded-xl border border-[#252B3B] bg-[#0B0D13] aspect-[16/10] max-h-[72vh]"
      >
        {!parsed.valid ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold text-[#F4F4F5]">
              Unable to load game iframe
            </h2>
            <p className="max-w-md text-sm text-[#A1A1AA]">{parsed.error}</p>
          </div>
        ) : (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0D1017] text-sm text-[#A1A1AA]">
                <span>Loading {game.title}...</span>
              </div>
            )}
            <iframe
              key={`${game.id}-${reloadNonce}`}
              ref={iframeRef}
              src={parsed.attrs.src}
              title={parsed.attrs.title}
              allow={parsed.attrs.allow}
              loading={parsed.attrs.loading}
              onLoad={() => {
                setIframeLoaded(true);
                iframeRef.current?.focus();
              }}
              className="h-full w-full border-0"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-xl border border-[#252B3B] bg-[#161A23] p-5 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-7">
          <h2 className="font-display text-base font-semibold text-[#F4F4F5]">
            About {game.title}
          </h2>
          <p className="text-sm leading-relaxed text-[#A1A1AA]">{game.description}</p>
          <p className="pt-1 text-xs text-[#D4D4D8]">
            <span className="text-[#A1A1AA]">Stored iframe markup: </span>
            <code className="font-mono text-[#E4E4E7] break-all">{game.iframe}</code>
          </p>
        </div>

        <div className="space-y-3 lg:col-span-5">
          <h2 className="font-display text-base font-semibold text-[#F4F4F5]">
            Switch Game
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {upNext.map((other) => (
              <button
                key={other.id}
                type="button"
                onClick={() => onSelectGame(other)}
                className="flex flex-col items-start rounded-lg border border-[#252B3B] bg-[#11151E] px-3 py-2 text-left transition-colors hover:border-[#FF5A36]/60 cursor-pointer"
              >
                <span className="truncate w-full text-sm font-medium text-[#F4F4F5]">
                  {other.title}
                </span>
                <span className="text-xs text-[#A1A1AA]">{other.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
