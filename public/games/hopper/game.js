(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');
  const titleOverlay = document.getElementById('titleOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const restartBtn = document.getElementById('restartBtn');
  const muteBtn = document.getElementById('muteBtn');

  const STORAGE_KEY = 'recess_hopper_best';
  let state = 'title';
  let score = 0;
  let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let muted = false;
  let audioCtx = null;
  let lastTime = 0;
  let spawnTimer = 0;

  const bird = { x: 130, y: 190, vy: 0, r: 13 };
  let gates = [];

  bestEl.textContent = String(best);

  function beep(freq, dur, type = 'triangle', vol = 0.07) {
    if (muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch {
      // Optional
    }
  }

  function setState(next) {
    state = next;
    document.body.dataset.state = next;
    titleOverlay.classList.toggle('hidden', next !== 'title');
    gameOverOverlay.classList.toggle('hidden', next !== 'gameover');
  }

  function spawnGate() {
    const gap = 128;
    const minTop = 55;
    const maxTop = canvas.height - gap - 70;
    const topH = minTop + Math.random() * (maxTop - minTop);
    gates.push({ x: canvas.width + 20, w: 54, topH, gap, passed: false });
  }

  function startGame() {
    score = 0;
    scoreEl.textContent = '0';
    bird.y = 190;
    bird.vy = -190;
    gates = [];
    spawnTimer = 0.4;
    lastTime = performance.now();
    setState('playing');
    beep(420, 0.08);
  }

  function flap() {
    if (state === 'title') {
      startGame();
      return;
    }
    if (state !== 'playing') return;
    bird.vy = -285;
    beep(480, 0.07);
  }

  function endGame() {
    beep(160, 0.24, 'sawtooth');
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      localStorage.setItem(STORAGE_KEY, String(best));
    }
    finalScoreEl.textContent = String(score);
    finalBestEl.textContent = String(best);
    setState('gameover');
  }

  function update(dt) {
    bird.vy += 760 * dt;
    bird.y += bird.vy * dt;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnGate();
      spawnTimer = 1.65;
    }

    const speed = 175 + Math.min(80, score * 3);
    for (let i = gates.length - 1; i >= 0; i -= 1) {
      const g = gates[i];
      g.x -= speed * dt;

      if (!g.passed && g.x + g.w < bird.x) {
        g.passed = true;
        score += 1;
        scoreEl.textContent = String(score);
        beep(660, 0.08);
      }

      const inX = bird.x + bird.r > g.x && bird.x - bird.r < g.x + g.w;
      const hitTop = bird.y - bird.r < g.topH;
      const hitBot = bird.y + bird.r > g.topH + g.gap;
      if (inX && (hitTop || hitBot)) {
        endGame();
        return;
      }

      if (g.x + g.w < -20) gates.splice(i, 1);
    }

    if (bird.y - bird.r < 0 || bird.y + bird.r > canvas.height - 20) {
      endGame();
    }
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#162038');
    sky.addColorStop(1, '#26384d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gates
    gates.forEach((g) => {
      ctx.fillStyle = '#34a87b';
      ctx.fillRect(g.x, 0, g.w, g.topH);
      ctx.fillRect(g.x, g.topH + g.gap, g.w, canvas.height - (g.topH + g.gap) - 20);
      ctx.fillStyle = '#257d5a';
      ctx.fillRect(g.x - 4, g.topH - 14, g.w + 8, 14);
      ctx.fillRect(g.x - 4, g.topH + g.gap, g.w + 8, 14);
    });

    // Ground strip
    ctx.fillStyle = '#141923';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.max(-0.45, Math.min(0.6, bird.vy / 480)));
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(-3, 2, 7, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(5, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(11, -2);
    ctx.lineTo(19, 2);
    ctx.lineTo(11, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state === 'playing') update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousedown', flap);
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'arrowup' || k === 'w') {
      e.preventDefault();
      if (state === 'gameover') startGame();
      else flap();
    } else if (k === 'r') {
      startGame();
    } else if (k === 'm') {
      muted = !muted;
      muteBtn.textContent = muted ? 'Muted' : 'Sound On';
    }
  });

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? 'Muted' : 'Sound On';
  });

  if (new URLSearchParams(window.location.search).get('autostart') === '1') {
    startGame();
  }
  requestAnimationFrame(loop);
})();
