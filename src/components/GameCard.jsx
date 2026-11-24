import { useState } from 'react';
import { Gamepad2, Play, Trash2 } from 'lucide-react';

export function GameCard({ game, onPlay, onRemoveCustom }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#2D3548]/90 bg-[#161A23]/92 backdrop-blur-sm transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#46516E]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#11151E]">
        {game.thumbnail && !imgFailed ? (
          <img
            src={game.thumbnail}
            alt={`${game.title} cover`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1C2231] to-[#11151E] p-4 text-center">
            <Gamepad2 className="h-8 w-8 text-[#FF5A36]" aria-hidden="true" />
            <span className="font-display text-sm font-semibold text-[#E4E4E7]">
              {game.title}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-semibold leading-snug text-[#F4F4F5]">
            {game.title}
          </h3>
          <p className="text-xs text-[#A1A1AA]">
            <span>{game.category}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{game.controls}</span>
          </p>
          <p className="line-clamp-2 pt-1 text-sm leading-relaxed text-[#A1A1AA]">
            {game.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onPlay(game)}
            aria-label={`Play ${game.title}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff6d4d] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span>Play</span>
          </button>

          {game.isCustom && onRemoveCustom && (
            <button
              type="button"
              onClick={() => onRemoveCustom(game.id)}
              aria-label={`Delete custom game ${game.title}`}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2D3548] bg-[#1D222E] text-[#A1A1AA] transition-colors hover:border-red-500/50 hover:text-red-400 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
