(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const speedEl = document.getElementById('speed');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');

  const titleOverlay = document.getElementById('titleOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');

  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const pauseRestartBtn = document.getElementById('pauseRestartBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const muteBtn = document.getElementById('muteBtn');

  const COLS = 28;
  const ROWS = 20;
  const CELL = 20;
  const STORAGE_KEY = 'recess_grid_snake_best';

  let state = 'title';
  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 18, y: 10 };
  let score = 0;
  let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let muted = false;
  let stepInterval = 115;
  let lastTick = 0;
  let rafId = 0;
  let audioCtx = null;

  bestEl.textContent = String(best);

  function beep(freq, dur, type = 'triangle', vol = 0.08) {
    if (muted) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch {
      // Audio optional
    }
  }

  function setState(next) {
    state = next;
    document.body.dataset.state = next;
    titleOverlay.classList.toggle('hidden', next !== 'title');
    pauseOverlay.classList.toggle('hidden', next !== 'paused');
    gameOverOverlay.classList.toggle('hidden', next !== 'gameover');
    pauseBtn.textContent = next === 'paused' ? 'Resume' : 'Pause';
  }

  function spawnFood() {
    const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
    const open = [];
    for (let x = 0; x < COLS; x += 1) {
      for (let y = 0; y < ROWS; y += 1) {
        if (!occupied.has(`${x},${y}`)) open.push({ x, y });
      }
    }
    if (open.length > 0) {
      food = open[Math.floor(Math.random() * open.length)];
    }
  }

  function resetGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    stepInterval = 115;
    scoreEl.textContent = '0';
    speedEl.textContent = '1.0x';
    spawnFood();
  }

  function startGame() {
    resetGame();
    lastTick = performance.now();
    setState('playing');
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function endGame() {
    beep(160, 0.25, 'sawtooth', 0.1);
    if (score > best) {
      best = score;
      localStorage.setItem(STORAGE_KEY, String(best));
      bestEl.textContent = String(best);
    }
    finalScoreEl.textContent = String(score);
    finalBestEl.textContent = String(best);
    setState('gameover');
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endGame();
      return;
    }

    const hitsBody = snake.some((seg, idx) => idx < snake.length - 1 && seg.x === head.x && seg.y === head.y);
    if (hitsBody) {
      endGame();
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = String(score);
      if (score > best) {
        best = score;
        bestEl.textContent = String(best);
        localStorage.setItem(STORAGE_KEY, String(best));
      }
      stepInterval = Math.max(58, 115 - Math.floor(score / 30) * 6);
      const mult = (115 / stepInterval).toFixed(1);
      speedEl.textContent = `${mult}x`;
      beep(540 + (score % 120), 0.08, 'triangle', 0.09);
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    ctx.fillStyle = '#0e131d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = '#182030';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(canvas.width, y * CELL);
      ctx.stroke();
    }

    // Food cube
    const fx = food.x * CELL;
    const fy = food.y * CELL;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(fx + 3, fy + 3, CELL - 6, CELL - 6, 4);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(fx + 6, fy + 6, 4, 4);

    // Snake
    snake.forEach((seg, idx) => {
      const sx = seg.x * CELL;
      const sy = seg.y * CELL;
      ctx.fillStyle = idx === 0 ? '#34d399' : idx % 2 === 0 ? '#10b981' : '#059669';
      ctx.beginPath();
      ctx.roundRect(sx + 1.5, sy + 1.5, CELL - 3, CELL - 3, idx === 0 ? 5 : 4);
      ctx.fill();

      if (idx === 0) {
        ctx.fillStyle = '#062c1e';
        const eyeOffsetX = dir.x === 0 ? 5 : dir.x > 0 ? 12 : 4;
        const eyeOffsetY = dir.y === 0 ? 5 : dir.y > 0 ? 12 : 4;
        ctx.fillRect(sx + eyeOffsetX, sy + eyeOffsetY, 3, 3);
      }
    });
  }

  function loop(now) {
    if (state === 'playing' && now - lastTick >= stepInterval) {
      lastTick = now;
      step();
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function queueDir(x, y) {
    if (dir.x === -x && dir.y === -y) return;
    nextDir = { x, y };
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (state === 'title' && (k === 'enter' || k === ' ')) {
      e.preventDefault();
      startGame();
      return;
    }
    if (state === 'gameover' && (k === 'enter' || k === ' ')) {
      e.preventDefault();
      startGame();
      return;
    }
    if (k === 'p' || k === 'escape') {
      if (state === 'playing') setState('paused');
      else if (state === 'paused') {
        lastTick = performance.now();
        setState('playing');
      }
      return;
    }
    if (k === 'r') {
      startGame();
      return;
    }
    if (k === 'm') {
      muted = !muted;
      muteBtn.textContent = muted ? 'Muted' : 'Sound On';
      return;
    }

    if (state !== 'playing') return;
    if (k === 'arrowup' || k === 'w') {
      e.preventDefault();
      queueDir(0, -1);
    } else if (k === 'arrowdown' || k === 's') {
      e.preventDefault();
      queueDir(0, 1);
    } else if (k === 'arrowleft' || k === 'a') {
      e.preventDefault();
      queueDir(-1, 0);
    } else if (k === 'arrowright' || k === 'd') {
      e.preventDefault();
      queueDir(1, 0);
    }
  });

  document.querySelectorAll('.pad-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state !== 'playing') return;
      const d = btn.getAttribute('data-dir');
      if (d === 'up') queueDir(0, -1);
      if (d === 'down') queueDir(0, 1);
      if (d === 'left') queueDir(-1, 0);
      if (d === 'right') queueDir(1, 0);
    });
  });

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  pauseRestartBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  resumeBtn.addEventListener('click', () => {
    lastTick = performance.now();
    setState('playing');
  });
  pauseBtn.addEventListener('click', () => {
    if (state === 'playing') setState('paused');
    else if (state === 'paused') {
      lastTick = performance.now();
      setState('playing');
    }
  });
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? 'Muted' : 'Sound On';
  });

  resetGame();
  if (new URLSearchParams(window.location.search).get('autostart') === '1') {
    startGame();
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
})();
