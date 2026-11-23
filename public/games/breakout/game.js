(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const stageEl = document.getElementById('stage');
  const livesEl = document.getElementById('lives');
  const endTitleEl = document.getElementById('endTitle');
  const finalScoreEl = document.getElementById('finalScore');
  const finalStageEl = document.getElementById('finalStage');

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

  const ROW_COLORS = ['#ff5a36', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  let state = 'title';
  let score = 0;
  let stage = 1;
  let lives = 3;
  let muted = false;
  let audioCtx = null;
  let lastTime = 0;
  let keys = { left: false, right: false };

  const paddle = { w: 96, h: 12, x: 252, y: 392, speed: 430, wideTimer: 0 };
  const ball = { x: 300, y: 370, r: 7, vx: 210, vy: -250 };
  let bricks = [];
  let powerups = [];

  function beep(freq, dur, type = 'sine', vol = 0.07) {
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

  function buildBricks() {
    bricks = [];
    const cols = 9;
    const rows = Math.min(6, 4 + stage - 1);
    const pad = 8;
    const marginX = 24;
    const brickW = (canvas.width - marginX * 2 - pad * (cols - 1)) / cols;
    const brickH = 20;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        bricks.push({
          x: marginX + c * (brickW + pad),
          y: 44 + r * (brickH + pad),
          w: brickW,
          h: brickH,
          hp: r === 0 && stage > 1 ? 2 : 1,
          color: ROW_COLORS[r % ROW_COLORS.length],
        });
      }
    }
  }

  function resetBall() {
    paddle.w = 96;
    paddle.wideTimer = 0;
    paddle.x = (canvas.width - paddle.w) / 2;
    ball.x = canvas.width / 2;
    ball.y = paddle.y - 12;
    const speedBoost = 1 + (stage - 1) * 0.12;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 195 * speedBoost;
    ball.vy = -255 * speedBoost;
  }

  function startGame() {
    score = 0;
    stage = 1;
    lives = 3;
    powerups = [];
    scoreEl.textContent = '0';
    stageEl.textContent = '1';
    livesEl.textContent = '3';
    buildBricks();
    resetBall();
    lastTime = performance.now();
    setState('playing');
  }

  function update(dt) {
    if (paddle.wideTimer > 0) {
      paddle.wideTimer -= dt;
      if (paddle.wideTimer <= 0) paddle.w = 96;
    }

    if (keys.left) paddle.x -= paddle.speed * dt;
    if (keys.right) paddle.x += paddle.speed * dt;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      beep(320, 0.05);
    } else if (ball.x + ball.r > canvas.width) {
      ball.x = canvas.width - ball.r;
      ball.vx = -Math.abs(ball.vx);
      beep(320, 0.05);
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      beep(340, 0.05);
    }

    // Paddle bounce
    if (
      ball.vy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      ball.x >= paddle.x - 4 &&
      ball.x <= paddle.x + paddle.w + 4
    ) {
      const hitOffset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const speed = Math.hypot(ball.vx, ball.vy);
      const angle = hitOffset * (Math.PI / 3);
      ball.vx = speed * Math.sin(angle);
      ball.vy = -Math.abs(speed * Math.cos(angle));
      ball.y = paddle.y - ball.r - 0.5;
      beep(460, 0.06);
    }

    // Bricks collision
    for (let i = bricks.length - 1; i >= 0; i -= 1) {
      const b = bricks[i];
      if (
        ball.x + ball.r > b.x &&
        ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y &&
        ball.y - ball.r < b.y + b.h
      ) {
        const overlapLeft = ball.x + ball.r - b.x;
        const overlapRight = b.x + b.w - (ball.x - ball.r);
        const overlapTop = ball.y + ball.r - b.y;
        const overlapBottom = b.y + b.h - (ball.y - ball.r);
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }

        b.hp -= 1;
        score += 20;
        scoreEl.textContent = String(score);
        beep(620, 0.07, 'triangle');

        if (b.hp <= 0) {
          if (Math.random() < 0.16) {
            powerups.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vy: 130 });
          }
          bricks.splice(i, 1);
        }
        break;
      }
    }

    // Powerups
    for (let i = powerups.length - 1; i >= 0; i -= 1) {
      const p = powerups[i];
      p.y += p.vy * dt;
      if (
        p.y + 8 >= paddle.y &&
        p.y - 8 <= paddle.y + paddle.h &&
        p.x >= paddle.x &&
        p.x <= paddle.x + paddle.w
      ) {
        paddle.w = 144;
        paddle.wideTimer = 8;
        beep(780, 0.12);
        powerups.splice(i, 1);
      } else if (p.y > canvas.height + 20) {
        powerups.splice(i, 1);
      }
    }

    if (bricks.length === 0) {
      stage += 1;
      stageEl.textContent = String(stage);
      beep(880, 0.2);
      buildBricks();
      resetBall();
    }

    if (ball.y - ball.r > canvas.height) {
      lives -= 1;
      livesEl.textContent = String(Math.max(0, lives));
      beep(170, 0.22, 'sawtooth');
      if (lives <= 0) {
        endTitleEl.textContent = 'Game Over';
        finalScoreEl.textContent = String(score);
        finalStageEl.textContent = String(stage);
        setState('gameover');
      } else {
        resetBall();
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#0e131d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bricks.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      if (b.hp > 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    powerups.forEach((p) => {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(p.x - 10, p.y - 6, 20, 12, 4);
      ctx.fill();
    });

    // Paddle
    ctx.fillStyle = paddle.wideTimer > 0 ? '#34d399' : '#e5e7eb';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
    ctx.fill();

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state === 'playing') update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', (e) => {
    if (state !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, mx - paddle.w / 2));
  });

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
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  });

  window.addEventListener('blur', () => {
    keys.left = false;
    keys.right = false;
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

  buildBricks();
  resetBall();
  if (new URLSearchParams(window.location.search).get('autostart') === '1') {
    startGame();
  }
  requestAnimationFrame(loop);
})();
