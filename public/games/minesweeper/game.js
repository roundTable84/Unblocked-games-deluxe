(() => {
  const gridEl = document.getElementById('grid');
  const minesLeftEl = document.getElementById('minesLeft');
  const timerEl = document.getElementById('timer');
  const flagModeBtn = document.getElementById('flagModeBtn');
  const difficultySelect = document.getElementById('difficultySelect');
  const restartBtn = document.getElementById('restartBtn');
  const endOverlay = document.getElementById('endOverlay');
  const endTitleEl = document.getElementById('endTitle');
  const finalTimeEl = document.getElementById('finalTime');
  const playAgainBtn = document.getElementById('playAgainBtn');

  let size = 9;
  let mineCount = 10;
  let board = [];
  let firstClick = true;
  let gameOver = false;
  let flagMode = false;
  let elapsed = 0;
  let timerId = null;

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    if (timerId !== null) return;
    timerId = setInterval(() => {
      elapsed += 1;
      timerEl.textContent = `${elapsed}s`;
    }, 1000);
  }

  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push([nr, nc]);
      }
    }
    return out;
  }

  function placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < mineCount) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if ((Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) || board[r][c].mine) {
        continue;
      }
      board[r][c].mine = true;
      placed += 1;
    }
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (board[r][c].mine) continue;
        board[r][c].adj = neighbors(r, c).filter(([nr, nc]) => board[nr][nc].mine).length;
      }
    }
  }

  function reveal(r, c) {
    const cell = board[r][c];
    if (cell.revealed || cell.flagged || gameOver) return;

    if (firstClick) {
      firstClick = false;
      placeMines(r, c);
      startTimer();
    }

    cell.revealed = true;
    if (cell.mine) {
      gameOver = true;
      stopTimer();
      board.forEach((row) => row.forEach((item) => {
        if (item.mine) item.revealed = true;
      }));
      endTitleEl.textContent = 'Mine Triggered';
      finalTimeEl.textContent = `${elapsed}s`;
      endOverlay.classList.remove('hidden');
      document.body.dataset.state = 'gameover';
      render();
      return;
    }

    if (cell.adj === 0) {
      neighbors(r, c).forEach(([nr, nc]) => reveal(nr, nc));
    }
    checkWin();
  }

  function checkWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (!board[r][c].mine && !board[r][c].revealed) unrevealedSafe += 1;
      }
    }
    if (unrevealedSafe === 0 && !gameOver) {
      gameOver = true;
      stopTimer();
      endTitleEl.textContent = 'Field Cleared!';
      finalTimeEl.textContent = `${elapsed}s`;
      endOverlay.classList.remove('hidden');
      document.body.dataset.state = 'gameover';
    }
  }

  function toggleFlag(r, c) {
    if (gameOver) return;
    const cell = board[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    render();
  }

  function render() {
    let flags = 0;
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridEl.innerHTML = '';

    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const cell = board[r][c];
        if (cell.flagged) flags += 1;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        if (cell.revealed) {
          btn.classList.add('revealed');
          if (cell.mine) {
            btn.classList.add('mine');
            btn.textContent = '✕';
          } else if (cell.adj > 0) {
            btn.classList.add(`n-${cell.adj}`);
            btn.textContent = String(cell.adj);
          }
        } else if (cell.flagged) {
          btn.classList.add('flagged');
          btn.textContent = '⚑';
        }
        btn.setAttribute('aria-label', `Row ${r + 1} Column ${c + 1}`);
        btn.addEventListener('click', () => {
          if (flagMode) toggleFlag(r, c);
          else {
            reveal(r, c);
            render();
          }
        });
        btn.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleFlag(r, c);
        });
        gridEl.appendChild(btn);
      }
    }

    minesLeftEl.textContent = String(Math.max(0, mineCount - flags));
  }

  function initBoard() {
    stopTimer();
    const diff = difficultySelect.value;
    size = diff === 'medium' ? 12 : 9;
    mineCount = diff === 'medium' ? 22 : 10;
    firstClick = true;
    gameOver = false;
    elapsed = 0;
    timerEl.textContent = '0s';
    endOverlay.classList.add('hidden');
    document.body.dataset.state = 'playing';

    board = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adj: 0,
      }))
    );
    render();
  }

  flagModeBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    flagModeBtn.textContent = flagMode ? 'Flag Mode: On' : 'Flag Mode: Off';
    flagModeBtn.classList.toggle('active', flagMode);
  });

  difficultySelect.addEventListener('change', initBoard);
  restartBtn.addEventListener('click', initBoard);
  playAgainBtn.addEventListener('click', initBoard);

  initBoard();
})();
