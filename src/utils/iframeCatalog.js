const ATTR_REGEX = /([a-zA-Z0-9_-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

export function isSafeIframeSrc(rawSrc) {
  const trimmed = String(rawSrc || '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('//')) return false;

  // Allow relative paths within the same origin
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return !/[\s<>"'`]/.test(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function parseIframeEntry(iframeInput, fallbackTitle = 'Unblocked Game') {
  const trimmed = String(iframeInput || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Iframe code or URL is required.' };
  }

  // Allow users to paste either a full <iframe ...></iframe> snippet or a direct URL/path
  if (!trimmed.toLowerCase().startsWith('<iframe')) {
    if (!isSafeIframeSrc(trimmed)) {
      return {
        valid: false,
        error: 'Enter a valid relative path (e.g. /games/snake/index.html) or https:// URL.',
      };
    }
    return {
      valid: true,
      attrs: {
        src: trimmed,
        title: fallbackTitle,
        allow: 'fullscreen; autoplay',
        loading: 'lazy',
      },
    };
  }

  const openTagMatch = trimmed.match(/^<iframe\b([^>]*)>/i);
  if (!openTagMatch) {
    return { valid: false, error: 'Malformed <iframe> tag.' };
  }

  const attrText = openTagMatch[1] ?? '';
  const attrsMap = new Map();
  ATTR_REGEX.lastIndex = 0;

  let match;
  while ((match = ATTR_REGEX.exec(attrText)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    attrsMap.set(key, val);
  }

  const src = (attrsMap.get('src') ?? '').trim();
  if (!src) {
    return { valid: false, error: 'The <iframe> tag must include a src attribute.' };
  }
  if (!isSafeIframeSrc(src)) {
    return {
      valid: false,
      error: 'Blocked unsafe iframe src. Only relative paths or http/https URLs are allowed.',
    };
  }

  const title = (attrsMap.get('title') ?? '').trim() || fallbackTitle;
  const allow = (attrsMap.get('allow') ?? '').trim() || 'fullscreen; autoplay';
  const loadingRaw = (attrsMap.get('loading') ?? '').toLowerCase();
  const loading = loadingRaw === 'eager' ? 'eager' : 'lazy';

  return {
    valid: true,
    attrs: {
      src,
      title,
      allow,
      loading,
    },
  };
}

export function buildIframeMarkup(src, title) {
  const safeSrc = src.replace(/"/g, '&quot;');
  const safeTitle = title.replace(/"/g, '&quot;');
  return `<iframe src="${safeSrc}" title="${safeTitle}" allow="fullscreen; autoplay" loading="lazy"></iframe>`;
}

export function filterGames(games, searchQuery, category, favoriteIds) {
  const q = searchQuery.trim().toLowerCase();

  return games.filter((game) => {
    if (category === 'Favorites') {
      if (!favoriteIds.has(game.id)) return false;
    } else if (category !== 'All') {
      if (game.category !== category) return false;
    }

    if (!q) return true;

    return (
      game.title.toLowerCase().includes(q) ||
      game.category.toLowerCase().includes(q) ||
      game.description.toLowerCase().includes(q) ||
      game.controls.toLowerCase().includes(q)
    );
  });
}

export function slugifyGameId(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'custom-game';
}

export function validateNewGameInput(draft, existingIds) {
  const errors = {};

  const title = draft.title.trim();
  const controls = draft.controls.trim();
  const description = draft.description.trim();

  if (title.length < 2) {
    errors.title = 'Game title must be at least 2 characters.';
  }

  if (!controls) {
    errors.controls = 'Specify controls (e.g. Arrow Keys or Mouse).';
  }

  const parsedIframe = parseIframeEntry(draft.iframeInput, title || 'Custom Game');
  if (!parsedIframe.valid) {
    errors.iframeInput = parsedIframe.error;
  }

  if (Object.keys(errors).length > 0 || !parsedIframe.valid) {
    return { valid: false, errors };
  }

  const baseId = slugifyGameId(title);
  let candidateId = baseId;
  let suffix = 2;
  while (existingIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const normalizedIframe = buildIframeMarkup(parsedIframe.attrs.src, title);

  return {
    valid: true,
    entry: {
      id: candidateId,
      title,
      category: draft.category,
      controls,
      description:
        description || `Custom embedded HTML5 game (${parsedIframe.attrs.src}).`,
      iframe: normalizedIframe,
      isCustom: true,
    },
  };
}

export function serializeCatalogJson(games) {
  const clean = games.map(({ isCustom: _ignored, ...rest }) => rest);
  return JSON.stringify(clean, null, 2);
}
