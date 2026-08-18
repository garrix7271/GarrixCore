// dashboard.js — page guard, greeting, logout, and saved-games management.
const API_BASE = "https://garrixcore.onrender.com/api";

const token = localStorage.getItem('authToken');
if (!token) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  greetUser();
  bindLogout();
  loadGames();
  bindAddGameForm();
});

function greetUser() {
  const userName = localStorage.getItem('userName');
  const heading = document.getElementById('welcomeHeading');
  if (userName && heading) {
    heading.textContent = 'Welcome back, ' + userName.split(' ')[0];
  }
}

function bindLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
  });
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
  };
}

// If the backend says our token is invalid/expired, bounce to login.
function handleAuthFailure(response) {
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
    return true;
  }
  return false;
}

async function loadGames() {
  try {
    const response = await fetch(`${API_BASE}/games`, { headers: authHeaders() });
    if (handleAuthFailure(response)) return;

    const data = await response.json();
    if (!response.ok) {
      showGamesError(data.message || 'Could not load your saved games.');
      return;
    }

    renderGames(data.games || []);
    renderStats(data.games || []);
  } catch (err) {
    console.error('Load games error:', err);
    showGamesError("Couldn't reach the server. Please try again.");
  }
}

function renderStats(games) {
  const total = games.length;
  const playing = games.filter((g) => g.status === 'playing').length;
  const completed = games.filter((g) => g.status === 'completed').length;

  const totalEl = document.getElementById('stat-total');
  const playingEl = document.getElementById('stat-playing');
  const completedEl = document.getElementById('stat-completed');

  if (totalEl) totalEl.textContent = total;
  if (playingEl) playingEl.textContent = playing;
  if (completedEl) completedEl.textContent = completed;
}

function bindAddGameForm() {
  const form = document.getElementById('add-game-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideGamesError();

    const titleInput = document.getElementById('game-title');
    const statusSelect = document.getElementById('game-status');
    const title = titleInput.value.trim();
    const status = statusSelect.value;

    if (!title) {
      showGamesError('Enter a game title first.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/games`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, status }),
      });
      if (handleAuthFailure(response)) return;

      const data = await response.json();
      if (!response.ok) {
        showGamesError(data.message || 'Could not add that game.');
        return;
      }

      titleInput.value = '';
      statusSelect.value = 'playing';
      loadGames();
    } catch (err) {
      console.error('Add game error:', err);
      showGamesError("Couldn't reach the server. Please try again.");
    }
  });
}

async function updateGameStatus(id, newStatus) {
  try {
    const response = await fetch(`${API_BASE}/games/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    if (handleAuthFailure(response)) return;

    if (!response.ok) {
      const data = await response.json();
      showGamesError(data.message || 'Could not update that game.');
      return;
    }
    loadGames();
  } catch (err) {
    console.error('Update game error:', err);
    showGamesError("Couldn't reach the server. Please try again.");
  }
}

async function deleteGameById(id) {
  try {
    const response = await fetch(`${API_BASE}/games/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (handleAuthFailure(response)) return;

    if (!response.ok) {
      const data = await response.json();
      showGamesError(data.message || 'Could not delete that game.');
      return;
    }
    loadGames();
  } catch (err) {
    console.error('Delete game error:', err);
    showGamesError("Couldn't reach the server. Please try again.");
  }
}

function renderGames(games) {
  const list = document.getElementById('game-list');
  const empty = document.getElementById('game-list-empty');
  if (!list) return;

  list.querySelectorAll('.game-item').forEach((el) => el.remove());

  if (games.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  games.forEach((game) => {
    const li = document.createElement('li');
    li.className = 'game-item';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'game-item-title';
    titleSpan.textContent = game.title;

    const controls = document.createElement('div');
    controls.className = 'game-item-controls';

    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select';
    ['playing', 'backlog', 'completed'].forEach((statusOption) => {
      const opt = document.createElement('option');
      opt.value = statusOption;
      opt.textContent = statusOption.charAt(0).toUpperCase() + statusOption.slice(1);
      if (statusOption === game.status) opt.selected = true;
      statusSelect.appendChild(opt);
    });
    statusSelect.addEventListener('change', () => {
      updateGameStatus(game.id, statusSelect.value);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-game-btn';
    deleteBtn.setAttribute('aria-label', 'Delete ' + game.title);
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    deleteBtn.addEventListener('click', () => deleteGameById(game.id));

    controls.appendChild(statusSelect);
    controls.appendChild(deleteBtn);

    li.appendChild(titleSpan);
    li.appendChild(controls);
    list.appendChild(li);
  });
}

function showGamesError(message) {
  const box = document.getElementById('games-error');
  if (box) {
    box.textContent = message;
    box.style.display = 'block';
  }
}

function hideGamesError() {
  const box = document.getElementById('games-error');
  if (box) box.style.display = 'none';
}