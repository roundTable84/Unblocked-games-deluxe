(() => {
  if (document.documentElement.dataset.appMounted === 'true') return;
  const root = document.getElementById('root');
  if (!root) return;

  const style = document.createElement('style');
  style.textContent = `
    body { margin: 0; min-height: 100vh; font-size: 90%; background: linear-gradient(rgba(11, 14, 23, 0.35), rgba(11, 14, 23, 0.4)), url('./public/assets/aistudio/978570_9108268c.jpg') center / cover no-repeat fixed #0F1117; color: #F4F4F5; font-family: "Plus Jakarta Sans", system-ui, sans-serif; }
    .ra-header { border-bottom: 1px solid rgba(37, 43, 59, 0.85); background: rgba(15, 17, 23, 0.82); backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 20; }
    .ra-wrap { max-width: 1152px; margin: 0 auto; padding: 0 20px; }
    .ra-nav-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 14px 0; }
    .ra-brand { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 18px; font-weight: 700; color: #F4F4F5; text-decoration: none; }
    .ra-btn { background: #FF5A36; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .ra-btn:hover { background: #ff6d4d; }
    .ra-btn-sec { background: #1D222E; color: #E4E4E7; border: 1px solid #2D3548; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .ra-btn-sec:hover { background: #252C3B; }
    .ra-main { padding: 32px 0; }
    .ra-empty { background: #161A23; border: 1px solid #252B3B; border-radius: 12px; padding: 48px 24px; text-align: center; }
    .ra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .ra-card { background: #161A23; border: 1px solid #252B3B; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .ra-card-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: space-between; }
    .ra-title { margin: 0; font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 18px; font-weight: 600; color: #F4F4F5; }
    .ra-desc { margin: 0; font-size: 14px; color: #A1A1AA; line-height: 1.5; }
    .ra-player-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; background: #161A23; border: 1px solid #252B3B; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; }
    .ra-player-left, .ra-player-actions { display: flex; align-items: center; gap: 12px; }
    .ra-frame-box { position: relative; width: 100%; aspect-ratio: 16 / 10; max-height: 76vh; background: #0B0D13; border: 1px solid #252B3B; border-radius: 12px; overflow: hidden; }
    .ra-frame-box.ra-expanded { position: fixed; inset: 0; z-index: 60; width: 100vw; height: 100vh; max-height: none; aspect-ratio: auto; border-radius: 0; border: none; }
    .ra-frame-box iframe { width: 100%; height: 100%; border: 0; display: block; }
    .ra-exit-float { position: fixed; top: 14px; right: 14px; z-index: 70; background: rgba(22, 26, 35, 0.9); color: #F4F4F5; border: 1px solid #2D3548; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
  `;
  document.head.appendChild(style);

  let games = [];
  let activeGame = null;
  let expanded = false;

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
    brand.textContent = 'Unblocked Games Deluxe';
    brand.onclick = (e) => {
      e.preventDefault();
      expanded = false;
      activeGame = null;
      render();
    };

    hWrap.appendChild(brand);
    header.appendChild(hWrap);
    root.appendChild(header);

    const main = document.createElement('main');
    main.className = 'ra-wrap ra-main';

    if (activeGame) {
      const bar = document.createElement('div');
      bar.className = 'ra-player-bar';

      const left = document.createElement('div');
      left.className = 'ra-player-left';
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ra-btn-sec';
      backBtn.textContent = 'Back';
      backBtn.onclick = () => {
        expanded = false;
        activeGame = null;
        render();
      };
      const title = document.createElement('strong');
      title.textContent = activeGame.title;
      left.append(backBtn, title);

      const actions = document.createElement('div');
      actions.className = 'ra-player-actions';

      const reloadBtn = document.createElement('button');
      reloadBtn.type = 'button';
      reloadBtn.className = 'ra-btn-sec';
      reloadBtn.textContent = 'Reload';

      const fsBtn = document.createElement('button');
      fsBtn.type = 'button';
      fsBtn.className = 'ra-btn';
      fsBtn.textContent = 'Fullscreen';

      actions.append(reloadBtn, fsBtn);
      bar.append(left, actions);

      const box = document.createElement('div');
      box.className = 'ra-frame-box' + (expanded ? ' ra-expanded' : '');
      const iframe = document.createElement('iframe');
      const src = extractSrc(activeGame.iframe);
      iframe.src = src;
      iframe.title = activeGame.title;
      iframe.allow = 'fullscreen; autoplay';
      iframe.allowFullscreen = true;
      iframe.setAttribute('allowfullscreen', '');
      box.appendChild(iframe);

      reloadBtn.onclick = () => {
        iframe.src = src;
      };

      fsBtn.onclick = async () => {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
          }
          if (box.requestFullscreen) {
            await box.requestFullscreen();
            return;
          }
          if (box.webkitRequestFullscreen) {
            box.webkitRequestFullscreen();
            return;
          }
        } catch {
          // Fall through to full-viewport theater expand
        }
        expanded = !expanded;
        box.className = 'ra-frame-box' + (expanded ? ' ra-expanded' : '');
        render();
      };

      main.append(bar, box);

      if (expanded) {
        const exitBtn = document.createElement('button');
        exitBtn.type = 'button';
        exitBtn.className = 'ra-exit-float';
        exitBtn.textContent = 'Exit Fullscreen';
        exitBtn.onclick = () => {
          expanded = false;
          render();
        };
        main.appendChild(exitBtn);
      }
    } else if (games.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'ra-empty';
      const h1 = document.createElement('h1');
      h1.className = 'ra-title';
      h1.textContent = 'No games in catalog';
      const p = document.createElement('p');
      p.className = 'ra-desc';
      p.style.marginTop = '8px';
      p.textContent = 'Add iframe game entries to games.json to display them here.';
      empty.append(h1, p);
      main.appendChild(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'ra-grid';
      games.forEach((game) => {
        const card = document.createElement('article');
        card.className = 'ra-card';
        if (game.thumbnail) {
          const img = document.createElement('img');
          img.src = String(game.thumbnail).replace(/^\.?\/assets\//i, './public/assets/');
          img.alt = `${game.title} cover`;
          img.style.width = '100%';
          img.style.aspectRatio = '4 / 3';
          img.style.objectFit = 'cover';
          img.style.display = 'block';
          card.appendChild(img);
        }
        const body = document.createElement('div');
        body.className = 'ra-card-body';
        const h3 = document.createElement('h3');
        h3.className = 'ra-title';
        h3.textContent = game.title;
        const desc = document.createElement('p');
        desc.className = 'ra-desc';
        desc.textContent = game.description || '';
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'ra-btn';
        playBtn.textContent = 'Play';
        playBtn.onclick = () => {
          expanded = false;
          activeGame = game;
          render();
        };
        body.append(h3, desc, playBtn);
        card.appendChild(body);
        grid.appendChild(card);
      });
      main.appendChild(grid);
    }

    root.appendChild(main);
  }

  function fetchCatalog() {
    const bust = Date.now();
    fetch(`./public/games.json?v=${bust}`, { cache: 'no-store' })
      .then((res) =>
        res.ok
          ? res.json()
          : fetch(`./games.json?v=${bust}`, { cache: 'no-store' }).then((r) => r.json())
      )
      .then((data) => {
        games = Array.isArray(data) ? data : [];
        if (activeGame) {
          activeGame = games.find((g) => g.id === activeGame.id) || activeGame;
        }
        render();
      })
      .catch(() => {
        root.innerHTML = '<p style="padding:32px;color:#A1A1AA">Unable to load games.json catalog.</p>';
      });
  }

  fetchCatalog();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) fetchCatalog();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') fetchCatalog();
  });
})();
