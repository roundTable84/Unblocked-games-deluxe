(() => {
  const gridEl = document.getElementById('grid');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const undoBtn = document.getElementById('undoBtn');
  const restartBtn = document.getElementById('restartBtn');
  const endOverlay = document.getElementById('endOverlay');
  const endTitleEl = document.getElementById('endTitle');
  const finalScoreEl = document.getElementById('finalScore');
  const keepPlayingBtn = document.getElementById('keepPlayingBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');

  const STORAGE_KEY = 'recess_2048_best';
  let board = [];
  let score = 0;
  let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let prevSnapshot = null;
  let wonOnce = false;
  let touchStart = null;

  bestEl.textContent = String(best);

  function emptyBoard() {
    return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  }

  function addTile() {
    const empties = [];
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (board[r][c] === 0) empties.push([r, c]);
      }
    }
    if (empties.length === 0) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function render() {
    gridEl.innerHTML = '';
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        const val = board[r][c];
        const cell = document.createElement('div');
        cell.className = val > 0 ? `cell t-${Math.min(val, 2048)}` : 'cell';
        cell.textContent = val > 0 ? String(val) : '';
        gridEl.appendChild(cell);
      }
    }
    scoreEl.textContent = String(score);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      localStorage.setItem(STORAGE_KEY, String(best));
    }
  }

  function slideLine(line) {
    const filtered = line.filter((n) => n !== 0);
    const out = [];
    let gained = 0;
    for (let i = 0; i < filtered.length; i += 1) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        out.push(merged);
        gained += merged;
        i += 1;
      } else {
        out.push(filtered[i]);
      }
    }
    while (out.length < 4) out.push(0);
    return { out, gained };
  }

  function canMove() {
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (board[r][c] === 0) return true;
        if (c < 3 && board[r][c] === board[r][c + 1]) return true;
        if (r < 3 && board[r][c] === board[r + 1][c]) return true;
      }
    }
    return false;
  }

  function has2048() {
    return board.some((row) => row.some((v) => v >= 2048));
  }

  function move(dir) {
    const clone = board.map((r) => [...r]);
    const prevScore = score;
    let moved = false;
    let totalGained = 0;

    for (let i = 0; i < 4; i += 1) {
      let line = [];
      for (let j = 0; j < 4; j += 1) {
        if (dir === 'left') line.push(board[i][j]);
        else if (dir === 'right') line.push(board[i][3 - j]);
        else if (dir === 'up') line.push(board[j][i]);
        else line.push(board[3 - j][i]);
      }

      const { out, gained } = slideLine(line);
      totalGained += gained;
      for (let j = 0; j < 4; j += 1) {
        const val = out[j];
        if (dir === 'left') {
          if (board[i][j] !== val) moved = true;
          board[i][j] = val;
        } else if (dir === 'right') {
          if (board[i][3 - j] !== val) moved = true;
          board[i][3 - j] = val;
        } else if (dir === 'up') {
          if (board[j][i] !== val) moved = true;
          board[j][i] = val;
        } else {
          if (board[3 - j][i] !== val) moved = true;
          board[3 - j][i] = val;
        }
      }
    }

    if (!moved) return;
    prevSnapshot = { board: clone, score: prevScore };
    score += totalGained;
    addTile();
    render();

    if (!wonOnce && has2048()) {
      wonOnce = true;
      endTitleEl.textContent = 'You Reached 2048!';
      finalScoreEl.textContent = String(score);
      keepPlayingBtn.classList.remove('hidden');
      endOverlay.classList.remove('hidden');
      document.body.dataset.state = 'gameover';
      return;
    }

    if (!canMove()) {
      endTitleEl.textContent = 'No Moves Left';
      finalScoreEl.textContent = String(score);
      keepPlayingBtn.classList.add('hidden');
      endOverlay.classList.remove('hidden');
      document.body.dataset.state = 'gameover';
    }
  }

  function newGame() {
    board = emptyBoard();
    score = 0;
    wonOnce = false;
    prevSnapshot = null;
    endOverlay.classList.add('hidden');
    document.body.dataset.state = 'playing';
    addTile();
    addTile();
    render();
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') {
      e.preventDefault();
      move('left');
    } else if (k === 'arrowright' || k === 'd') {
      e.preventDefault();
      move('right');
    } else if (k === 'arrowup' || k === 'w') {
      e.preventDefault();
      move('up');
    } else if (k === 'arrowdown' || k === 's') {
      e.preventDefault();
      move('down');
    }
  });

  gridEl.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  gridEl.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  }, { passive: true });

  undoBtn.addEventListener('click', () => {
    if (!prevSnapshot) return;
    board = prevSnapshot.board.map((r) => [...r]);
    score = prevSnapshot.score;
    prevSnapshot = null;
    endOverlay.classList.add('hidden');
    document.body.dataset.state = 'playing';
    render();
  });

  restartBtn.addEventListener('click', newGame);
  playAgainBtn.addEventListener('click', newGame);
  keepPlayingBtn.addEventListener('click', () => {
    endOverlay.classList.add('hidden');
    document.body.dataset.state = 'playing';
  });

  newGame();
})();
