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
    .ra-btn { background: #FF5A36; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .ra-btn-sec { background: #1D222E; color: #E4E4E7; border: 1px solid #2D3548; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .ra-main { padding: 32px 0; }
    .ra-empty { background: #161A23; border: 1px solid #252B3B; border-radius: 12px; padding: 48px 24px; text-align: center; }
    .ra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .ra-card { background: #161A23; border: 1px solid #252B3B; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .ra-card-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: space-between; }
    .ra-title { margin: 0; font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 18px; font-weight: 600; color: #F4F4F5; }
    .ra-desc { margin: 0; font-size: 14px; color: #A1A1AA; line-height: 1.5; }
    .ra-player-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; background: #161A23; border: 1px solid #252B3B; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; }
    .ra-frame-box { width: 100%; aspect-ratio: 16 / 10; max-height: 76vh; background: #0B0D13; border: 1px solid #252B3B; border-radius: 12px; overflow: hidden; }
    .ra-frame-box iframe { width: 100%; height: 100%; border: 0; display: block; }
  `;
  document.head.appendChild(style);

  let games = [];
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

    hWrap.appendChild(brand);
    header.appendChild(hWrap);
    root.appendChild(header);

    const main = document.createElement('main');
    main.className = 'ra-wrap ra-main';

    if (activeGame) {
      const bar = document.createElement('div');
      bar.className = 'ra-player-bar';
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ra-btn-sec';
      backBtn.textContent = 'Back';
      backBtn.onclick = () => {
        activeGame = null;
        render();
      };
      const title = document.createElement('strong');
      title.textContent = activeGame.title;
      bar.append(backBtn, title);

      const box = document.createElement('div');
      box.className = 'ra-frame-box';
      const iframe = document.createElement('iframe');
      iframe.src = extractSrc(activeGame.iframe);
      iframe.title = activeGame.title;
      iframe.allow = 'fullscreen; autoplay';
      box.appendChild(iframe);
      main.append(bar, box);
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
