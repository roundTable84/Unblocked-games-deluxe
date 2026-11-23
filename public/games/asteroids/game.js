(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const waveEl = document.getElementById('wave');
  const livesEl = document.getElementById('lives');
  const finalScoreEl = document.getElementById('finalScore');
  const finalWaveEl = document.getElementById('finalWave');

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

  let state = 'title';
  let score = 0;
  let wave = 1;
  let lives = 3;
  let muted = false;
  let audioCtx = null;
  let lastTime = 0;
  let fireCooldown = 0;

  const keys = { left: false, right: false, thrust: false, fire: false };
  const ship = { x: 320, y: 210, vx: 0, vy: 0, angle: -Math.PI / 2, invuln: 2 };
  let bullets = [];
  let asteroids = [];
  const stars = Array.from({ length: 55 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.5,
  }));

  function beep(freq, dur, type = 'square', vol = 0.05) {
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
    pauseOverlay.classList.toggle('hidden', next !== 'paused');
    gameOverOverlay.classList.toggle('hidden', next !== 'gameover');
    pauseBtn.textContent = next === 'paused' ? 'Resume' : 'Pause';
  }

  function makeAsteroid(x, y, radius) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (48 + Math.random() * 48) * (1 + (wave - 1) * 0.14);
    const verts = [];
    const count = 9;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const offset = 0.78 + Math.random() * 0.35;
      verts.push({ a, r: radius * offset });
    }
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      verts,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.4,
    };
  }

  function spawnWave() {
    asteroids = [];
    const total = 3 + wave;
    for (let i = 0; i < total; i += 1) {
      let x = Math.random() * canvas.width;
      let y = Math.random() * canvas.height;
      if (Math.hypot(x - ship.x, y - ship.y) < 130) {
        x = (ship.x + 240) % canvas.width;
      }
      asteroids.push(makeAsteroid(x, y, 30));
    }
  }

  function resetShip() {
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    ship.invuln = 2.2;
  }

  function startGame() {
    score = 0;
    wave = 1;
    lives = 3;
    bullets = [];
    scoreEl.textContent = '0';
    waveEl.textContent = '1';
    livesEl.textContent = '3';
    resetShip();
    spawnWave();
    lastTime = performance.now();
    setState('playing');
  }

  function wrap(obj) {
    if (obj.x < 0) obj.x += canvas.width;
    if (obj.x > canvas.width) obj.x -= canvas.width;
    if (obj.y < 0) obj.y += canvas.height;
    if (obj.y > canvas.height) obj.y -= canvas.height;
  }

  function update(dt) {
    if (keys.left) ship.angle -= 3.6 * dt;
    if (keys.right) ship.angle += 3.6 * dt;
    if (keys.thrust) {
      ship.vx += Math.cos(ship.angle) * 260 * dt;
      ship.vy += Math.sin(ship.angle) * 260 * dt;
    }

    ship.vx *= 0.992;
    ship.vy *= 0.992;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    wrap(ship);

    if (ship.invuln > 0) ship.invuln -= dt;
    if (fireCooldown > 0) fireCooldown -= dt;

    if (keys.fire && fireCooldown <= 0) {
      bullets.push({
        x: ship.x + Math.cos(ship.angle) * 14,
        y: ship.y + Math.sin(ship.angle) * 14,
        vx: Math.cos(ship.angle) * 430 + ship.vx * 0.2,
        vy: Math.sin(ship.angle) * 430 + ship.vy * 0.2,
        life: 1.15,
      });
      fireCooldown = 0.2;
      beep(720, 0.06, 'triangle', 0.05);
    }

    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      wrap(b);
      if (b.life <= 0) bullets.splice(i, 1);
    }

    for (let i = asteroids.length - 1; i >= 0; i -= 1) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.rotSpeed * dt;
      wrap(a);

      // Bullet hits
      let hit = false;
      for (let j = bullets.length - 1; j >= 0; j -= 1) {
        const b = bullets[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius) {
          bullets.splice(j, 1);
          hit = true;
          break;
        }
      }

      if (hit) {
        beep(220, 0.12, 'sawtooth', 0.07);
        score += a.radius > 22 ? 25 : a.radius > 14 ? 50 : 100;
        scoreEl.textContent = String(score);
        if (a.radius > 14) {
          const nextR = a.radius * 0.6;
          asteroids.push(makeAsteroid(a.x, a.y, nextR));
          asteroids.push(makeAsteroid(a.x, a.y, nextR));
        }
        asteroids.splice(i, 1);
        continue;
      }

      // Ship collision
      if (ship.invuln <= 0 && Math.hypot(a.x - ship.x, a.y - ship.y) < a.radius + 10) {
        lives -= 1;
        livesEl.textContent = String(Math.max(0, lives));
        beep(130, 0.25, 'sawtooth', 0.09);
        if (lives <= 0) {
          finalScoreEl.textContent = String(score);
          finalWaveEl.textContent = String(wave);
          setState('gameover');
          return;
        }
        resetShip();
      }
    }

    if (asteroids.length === 0) {
      wave += 1;
      waveEl.textContent = String(wave);
      beep(860, 0.2, 'triangle', 0.07);
      spawnWave();
    }
  }

  function draw() {
    ctx.fillStyle = '#090c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#334155';
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Asteroids
    ctx.strokeStyle = '#94a3b8';
    ctx.fillStyle = '#1e293b';
    ctx.lineWidth = 2;
    asteroids.forEach((a) => {
      ctx.beginPath();
      a.verts.forEach((v, idx) => {
        const px = a.x + Math.cos(v.a + a.rot) * v.r;
        const py = a.y + Math.sin(v.a + a.rot) * v.r;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Bullets
    ctx.fillStyle = '#fb923c';
    bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship
    if (ship.invuln <= 0 || Math.floor(ship.invuln * 10) % 2 === 0) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = '#0c4a6e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -9);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (keys.thrust && state === 'playing') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-17, 0);
        ctx.lineTo(-8, 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state === 'playing') update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ((state === 'title' || state === 'gameover') && (k === 'enter' || k === ' ')) {
      e.preventDefault();
      startGame();
      return;
    }
    if (k === 'p' || k === 'escape') {
      if (state === 'playing') setState('paused');
      else if (state === 'paused') {
        lastTime = performance.now();
        setState('playing');
      }
      return;
    }
    if (k === 'r') startGame();
    if (k === 'm') {
      muted = !muted;
      muteBtn.textContent = muted ? 'Muted' : 'Sound On';
    }
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    if (k === 'arrowright' || k === 'd') keys.right = true;
    if (k === 'arrowup' || k === 'w') keys.thrust = true;
    if (k === ' ') {
      e.preventDefault();
      keys.fire = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
    if (k === 'arrowup' || k === 'w') keys.thrust = false;
    if (k === ' ') keys.fire = false;
  });

  window.addEventListener('blur', () => {
    keys.left = keys.right = keys.thrust = keys.fire = false;
  });

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  pauseRestartBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  resumeBtn.addEventListener('click', () => {
    lastTime = performance.now();
    setState('playing');
  });
  pauseBtn.addEventListener('click', () => {
    if (state === 'playing') setState('paused');
    else if (state === 'paused') {
      lastTime = performance.now();
      setState('playing');
    }
  });
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? 'Muted' : 'Sound On';
  });

  resetShip();
  spawnWave();
  if (new URLSearchParams(window.location.search).get('autostart') === '1') {
    startGame();
  }
  requestAnimationFrame(loop);
})();
