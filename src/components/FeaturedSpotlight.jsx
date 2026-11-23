import { useState } from 'react';
import { Code2, Gamepad2, Play } from 'lucide-react';

export function FeaturedSpotlight({
  game,
  totalCount,
  onPlay,
  onInspectJson,
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      aria-label="Featured game"
      className="grid grid-cols-1 items-stretch overflow-hidden rounded-xl border border-[#252B3B] bg-[#161A23] lg:grid-cols-12"
    >
      <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-7">
        <div className="space-y-3">
          <p className="text-xs font-medium text-[#A1A1AA] tabular-nums">
            Featured Pick · {game.category} · {totalCount} Browser Games Ready
          </p>
          <h1
            className="font-display text-3xl font-bold tracking-tight text-[#F4F4F5] sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            {game.title}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[#A1A1AA]">
            {game.description}
          </p>
          <p className="text-sm text-[#D4D4D8]">
            <span className="text-[#A1A1AA]">Controls: </span>
            <span className="font-mono text-xs">{game.controls}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onPlay(game)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FF5A36] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ff6d4d] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>Play {game.title}</span>
          </button>

          <button
            type="button"
            onClick={onInspectJson}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2D3548] bg-[#1D222E] px-4 py-2.5 text-sm font-medium text-[#E4E4E7] transition-colors hover:bg-[#252C3B] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
          >
            <Code2 className="h-4 w-4" aria-hidden="true" />
            <span>View games.json</span>
          </button>
        </div>
      </div>

      <div className="relative min-h-[220px] bg-[#11151E] lg:col-span-5">
        {game.thumbnail && !imgFailed ? (
          <img
            src={game.thumbnail}
            alt={`${game.title} cover art`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover lg:h-full"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1B2230] to-[#11151E] p-6 text-center">
            <Gamepad2 className="h-10 w-10 text-[#FF5A36]" aria-hidden="true" />
            <span className="font-display text-lg font-semibold text-[#F4F4F5]">
              {game.title}
            </span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#161A23]/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#161A23]/40 lg:via-transparent lg:to-transparent"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
