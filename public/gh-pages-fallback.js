(() => {
  if (document.documentElement.dataset.appMounted === 'true') return;
  const root = document.getElementById('root');
  if (!root) return;

  const style = document.createElement('style');
  style.textContent = `
    body { margin: 0; background: #0F1117; color: #F4F4F5; font-family: "Plus Jakarta Sans", system-ui, sans-serif; }
    .ra-header { border-bottom: 1px solid #252B3B; background: #0F1117; position: sticky; top: 0; z-index: 20; }
    .ra-wrap { max-width: 1152px; margin: 0 auto; padding: 0 20px; }
    .ra-nav-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 14px 0; }
    .ra-brand { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 18px; font-weight: 700; color: #F4F4F5; text-decoration: none; white-space: nowrap; }
    .ra-nav { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .ra-link { background: none; border: none; border-bottom: 2px solid transparent; color: #A1A1AA; font-size: 14px; font-weight: 500; cursor: pointer; padding: 2px 0; }
    .ra-link.active { color: #F4F4F5; border-bottom-color: #FF5A36; }
    .ra-btn { background: #FF5A36; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .ra-btn:hover { background: #ff6d4d; }
    .ra-btn-sec { background: #1D222E; color: #E4E4E7; border: 1px solid #2D3548; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .ra-main { padding: 24px 0 48px; }
    .ra-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #252B3B; }
    .ra-search { background: #161A23; border: 1px solid #252B3B; border-radius: 8px; color: #F4F4F5; padding: 9px 12px; font-size: 14px; min-width: 240px; }
    .ra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .ra-card { background: #161A23; border: 1px solid #252B3B; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .ra-thumb { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: #11151E; display: block; }
    .ra-card-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: space-between; }
    .ra-title { margin: 0; font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 18px; font-weight: 600; color: #F4F4F5; }
    .ra-meta { margin: 0; font-size: 12px; color: #A1A1AA; }
    .ra-desc { margin: 0; font-size: 14px; color: #A1A1AA; line-height: 1.5; }
    .ra-player-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; background: #161A23; border: 1px solid #252B3B; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; }
    .ra-frame-box { width: 100%; aspect-ratio: 16 / 10; max-height: 74vh; background: #0B0D13; border: 1px solid #252B3B; border-radius: 12px; overflow: hidden; }
    .ra-frame-box iframe { width: 100%; height: 100%; border: 0; display: block; }
  `;
  document.head.appendChild(style);

  let games = [];
  let category = 'All';
  let query = '';
  let activeGame = null;

  function extractSrc(iframeHtml) {
    const m = String(iframeHtml || '').match(/src\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const raw = m ? (m[1] || m[2] || '') : '';
    if (raw.startsWith('./games/')) return './public/games/' + raw.slice('./games/'.length);
    if (raw.startsWith('/games/')) return './public/games/' + raw.slice('/games/'.length);
    return raw;
  }

  function render() {
    root.innerHTML = '';

    const header = document.createElement('header');
    header.className = 'ra-header';
    const hWrap = document.createElement('div');
    hWrap.className = 'ra-wrap ra-nav-row';

    const brand = document.createElement('a');
    brand.href = '#library';
    brand.className = 'ra-brand';
    brand.textContent = 'Recess Arcade';
    brand.onclick = (e) => {
      e.preventDefault();
      activeGame = null;
      render();
    };

    const nav = document.createElement('nav');
    nav.className = 'ra-nav';
    ['All', 'Arcade', 'Puzzle', 'Action'].forEach((cat) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ra-link' + (!activeGame && category === cat ? ' active' : '');
      b.textContent = cat === 'All' ? 'All Games' : cat;
      b.onclick = () => {
        category = cat;
        activeGame = null;
        render();
      };
      nav.appendChild(b);
    });

    const randBtn = document.createElement('button');
    randBtn.type = 'button';
    randBtn.className = 'ra-btn';
    randBtn.textContent = 'Random Game';
    randBtn.onclick = () => {
      if (!games.length) return;
      activeGame = games[Math.floor(Math.random() * games.length)];
      render();
    };

    hWrap.append(brand, nav, randBtn);
    header.appendChild(hWrap);
    root.appendChild(header);

    const main = document.createElement('main');
    main.className = 'ra-wrap ra-main';

    if (activeGame) {
      const bar = document.createElement('div');
      bar.className = 'ra-player-bar';
      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '14px';

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ra-btn-sec';
      backBtn.textContent = 'Back to Library';
      backBtn.onclick = () => {
        activeGame = null;
        render();
      };

      const title = document.createElement('strong');
      title.textContent = activeGame.title;
      left.append(backBtn, title);

      const fsBtn = document.createElement('button');
      fsBtn.type = 'button';
      fsBtn.className = 'ra-btn';
      fsBtn.textContent = 'Fullscreen';

      bar.append(left, fsBtn);

      const box = document.createElement('div');
      box.className = 'ra-frame-box';
      const iframe = document.createElement('iframe');
      iframe.src = extractSrc(activeGame.iframe);
      iframe.title = activeGame.title;
      iframe.allow = 'fullscreen; autoplay';
      box.appendChild(iframe);

      fsBtn.onclick = () => {
        if (box.requestFullscreen) box.requestFullscreen().catch(() => {});
      };

      main.append(bar, box);
    } else {
      const toolbar = document.createElement('div');
      toolbar.className = 'ra-toolbar';
      const heading = document.createElement('h1');
      heading.className = 'ra-title';
      heading.style.fontSize = '24px';
      heading.textContent = category === 'All' ? 'Browser Games Library' : `${category} Games`;

      const search = document.createElement('input');
      search.type = 'search';
      search.className = 'ra-search';
      search.placeholder = 'Search games...';
      search.value = query;
      search.oninput = (e) => {
        query = e.target.value;
        render();
      };

      toolbar.append(heading, search);
      main.appendChild(toolbar);

      const filtered = games.filter((g) => {
        if (category !== 'All' && g.category !== category) return false;
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
      });

      const grid = document.createElement('div');
      grid.className = 'ra-grid';
      filtered.forEach((game) => {
        const card = document.createElement('article');
        card.className = 'ra-card';

        if (game.thumbnail) {
          const img = document.createElement('img');
          img.src = game.thumbnail;
          img.alt = `${game.title} cover`;
          img.className = 'ra-thumb';
          card.appendChild(img);
        }

        const body = document.createElement('div');
        body.className = 'ra-card-body';

        const info = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.className = 'ra-title';
        h3.textContent = game.title;
        const meta = document.createElement('p');
        meta.className = 'ra-meta';
        meta.textContent = `${game.category} · ${game.controls}`;
        const desc = document.createElement('p');
        desc.className = 'ra-desc';
        desc.textContent = game.description;
        info.append(h3, meta, desc);

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'ra-btn';
        playBtn.textContent = 'Play';
        playBtn.onclick = () => {
          activeGame = game;
          render();
        };

        body.append(info, playBtn);
        card.appendChild(body);
        grid.appendChild(card);
      });

      main.appendChild(grid);
    }

    root.appendChild(main);
  }

  fetch('./public/games.json')
    .then((res) => (res.ok ? res.json() : fetch('./games.json').then((r) => r.json())))
    .then((data) => {
      games = Array.isArray(data) ? data : [];
      render();
    })
    .catch(() => {
      root.innerHTML = '<p style="padding:32px;color:#A1A1AA">Unable to load games.json catalog.</p>';
    });
})();
