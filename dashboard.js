// dashboard.js — page guard, greeting, logout, and saved-games management.
const API_BASE = "https://garrixcore.onrender.com/api";
let allGames = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'recent';
let currentEditingGameId = null;

const token = localStorage.getItem('authToken');
if (!token) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  greetUser();
  bindLogout();
  bindLibraryFilters();
  bindEditModal();
  bindProfileEditor();
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

function bindLibraryFilters() {
  const searchInput = document.getElementById('game-search');
  const filterSelect = document.getElementById('game-filter');
  const sortSelect = document.getElementById('game-sort');

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      currentSearch = event.target.value.trim().toLowerCase();
      applyGameFilters();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', (event) => {
      currentFilter = event.target.value;
      applyGameFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
      currentSort = event.target.value;
      applyGameFilters();
    });
  }
}

function getGameGradient(title) {
  const palettes = [
    ['#8b5cf6', '#ec4899'],
    ['#22c55e', '#14b8a6'],
    ['#f59e0b', '#ef4444'],
    ['#3b82f6', '#8b5cf6'],
    ['#f97316', '#ec4899'],
    ['#10b981', '#3b82f6'],
  ];

  const hash = title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `linear-gradient(135deg, ${palettes[hash % palettes.length][0]}, ${palettes[hash % palettes.length][1]})`;
}

function sortGames(games) {
  const sorted = [...games];

  switch (currentSort) {
    case 'title':
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'hours':
      return sorted.sort((a, b) => Number(b.hoursPlayed || 0) - Number(a.hoursPlayed || 0));
    case 'progress':
      return sorted.sort((a, b) => Number(b.completion || 0) - Number(a.completion || 0));
    case 'status':
      return sorted.sort((a, b) => {
        const order = { playing: 0, backlog: 1, completed: 2 };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
      });
    case 'recent':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
}

function applyGameFilters() {
  const filteredGames = allGames.filter((game) => {
    const matchesStatus = currentFilter === 'all' || game.status === currentFilter;
    const haystack = `${game.title} ${game.platform || ''} ${game.notes || ''}`.toLowerCase();
    const matchesSearch = !currentSearch || haystack.includes(currentSearch);
    return matchesStatus && matchesSearch;
  });

  renderGames(sortGames(filteredGames));
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

    allGames = data.games || [];
    renderStats(allGames);
    applyGameFilters();
  } catch (err) {
    console.error('Load games error:', err);
    showGamesError("Couldn't reach the server. Please try again.");
  }
}

function renderStats(games) {
  const total = games.length;
  const playing = games.filter((g) => g.status === 'playing').length;
  const completed = games.filter((g) => g.status === 'completed').length;
  const totalHours = games.reduce((sum, g) => sum + (Number(g.hoursPlayed) || 0), 0);

  const totalEl = document.getElementById('stat-total');
  const playingEl = document.getElementById('stat-playing');
  const completedEl = document.getElementById('stat-completed');
  const hoursEl = document.getElementById('stat-hours');

  if (totalEl) totalEl.textContent = total;
  if (playingEl) playingEl.textContent = playing;
  if (completedEl) completedEl.textContent = completed;
  if (hoursEl) hoursEl.textContent = `${Math.round(totalHours)}h`;

  renderProfileSummary(games);
}

function getProfileData() {
  return {
    bio: localStorage.getItem('profileBio') || 'No bio yet — write a short description about your playstyle.',
    customPlatform: localStorage.getItem('profilePlatform') || '',
  };
}

function renderProfileSummary(games) {
  const profileName = document.getElementById('profileName');
  const profileAvatar = document.getElementById('profileAvatar');
  const profilePlatform = document.getElementById('profilePlatform');
  const profileAverage = document.getElementById('profileAverage');
  const profileStreak = document.getElementById('profileStreak');

  const userName = localStorage.getItem('userName') || 'Gamer';
  const firstName = userName.split(' ')[0];
  const { bio, customPlatform } = getProfileData();

  if (profileName) profileName.textContent = firstName;
  if (profileAvatar) profileAvatar.textContent = firstName.slice(0, 2).toUpperCase();

  const profileBio = document.getElementById('profileBio');
  if (profileBio) profileBio.textContent = bio;

  const platformCounts = {};
  games.forEach((game) => {
    const platform = game.platform || 'PC';
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
  });
  const favoritePlatform = customPlatform || Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'PC';
  if (profilePlatform) profilePlatform.textContent = favoritePlatform;

  const averageCompletion = games.length
    ? Math.round(games.reduce((sum, game) => sum + (Number(game.completion) || 0), 0) / games.length)
    : 0;
  if (profileAverage) profileAverage.textContent = `${averageCompletion}%`;

  const activeStreak = games.filter((game) => ['playing', 'completed'].includes(game.status)).length;
  if (profileStreak) profileStreak.textContent = String(activeStreak);

  renderInsights(games);
  renderAchievements(games);
  renderActivity(games);
  renderCommunity();
}

function renderCommunity() {
  const friendsList = document.getElementById('friendsList');
  const recommendationsList = document.getElementById('recommendationsList');

  const friends = [
    { name: 'Aiko', game: 'Helldivers 2', platform: 'PC' },
    { name: 'Milo', game: 'Final Fantasy XVI', platform: 'PlayStation 5' },
    { name: 'Jade', game: 'Monster Hunter Rise', platform: 'Switch' },
  ];

  const recommendations = [
    { title: 'Elden Ring', reason: 'High completion overlap', tag: 'RPG' },
    { title: 'Baldur\'s Gate 3', reason: 'Party-based co-op favorite', tag: 'CRPG' },
    { title: 'Stardew Valley', reason: 'Relaxed session pick', tag: 'Sim' },
  ];

  if (friendsList) {
    friendsList.innerHTML = friends.map((friend) => `
      <li class="friend-item">
        <div class="friend-main">
          <div class="friend-avatar">${friend.name.slice(0, 2).toUpperCase()}</div>
          <div class="friend-copy">
            <strong>${friend.name}</strong>
            <small>${friend.game}</small>
          </div>
        </div>
        <span class="friend-status">${friend.platform}</span>
      </li>
    `).join('');
  }

  if (recommendationsList) {
    recommendationsList.innerHTML = recommendations.map((game) => `
      <li class="recommendation-item">
        <div class="recommendation-copy">
          <div class="recommendation-tag">${game.tag.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>${game.title}</strong>
            <span>${game.reason}</span>
          </div>
        </div>
        <span class="recommendation-meta">${game.tag}</span>
      </li>
    `).join('');
  }
}

function renderInsights(games) {
  const panel = document.getElementById('libraryInsights');
  if (!panel) return;

  const totalGames = games.length;
  const totalHours = games.reduce((sum, game) => sum + (Number(game.hoursPlayed) || 0), 0);
  const completedGames = games.filter((game) => game.status === 'completed').length;
  const platformCounts = {};
  games.forEach((game) => {
    const platform = game.platform || 'PC';
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
  });
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];
  const mostPlayedGame = games.reduce((best, game) => {
    if (!best) return game;
    return (Number(game.hoursPlayed) || 0) > (Number(best.hoursPlayed) || 0) ? game : best;
  }, null);
  const avgCompletion = totalGames
    ? Math.round(games.reduce((sum, game) => sum + (Number(game.completion) || 0), 0) / totalGames)
    : 0;

  const insightCards = [
    {
      value: totalGames ? `${topPlatform ? topPlatform[0] : 'PC'}` : '—',
      label: 'Top platform',
    },
    {
      value: mostPlayedGame ? `${Math.round(Number(mostPlayedGame.hoursPlayed || 0))}h` : '0h',
      label: 'Most played',
    },
    {
      value: `${avgCompletion}%`,
      label: 'Avg. progress',
    },
    {
      value: totalGames ? `${completedGames}/${totalGames}` : '0/0',
      label: 'Completed',
    },
  ];

  panel.innerHTML = insightCards.map((card) => `
    <div class="insight-card">
      <span class="insight-value">${card.value}</span>
      <span class="insight-label">${card.label}</span>
    </div>
  `).join('');

  if (!totalGames) {
    panel.innerHTML = `
      <div class="insight-card">
        <span class="insight-value">0</span>
        <span class="insight-label">Games logged</span>
      </div>
      <div class="insight-card">
        <span class="insight-value">0h</span>
        <span class="insight-label">Hours played</span>
      </div>
      <div class="insight-card">
        <span class="insight-value">0%</span>
        <span class="insight-label">Avg. progress</span>
      </div>
      <div class="insight-card">
        <span class="insight-value">0/0</span>
        <span class="insight-label">Completed</span>
      </div>
    `;
  }
}

function getAchievements(games) {
  const total = games.length;
  const completed = games.filter((game) => game.status === 'completed').length;
  const totalHours = games.reduce((sum, game) => sum + (Number(game.hoursPlayed) || 0), 0);

  const achievements = [];

  if (total >= 1) achievements.push({ icon: '1', title: 'First Quest', text: 'Added your first game to the library.' });
  if (completed >= 1) achievements.push({ icon: '✓', title: 'Finisher', text: 'Completed your first title.' });
  if (completed >= 3) achievements.push({ icon: '★', title: 'Completionist', text: 'Finished 3 games in total.' });
  if (totalHours >= 25) achievements.push({ icon: '⏱', title: 'Time Keeper', text: 'Logged more than 25 hours.' });
  if (games.some((game) => game.status === 'playing')) achievements.push({ icon: '▶', title: 'In Progress', text: 'You are currently playing something.' });

  return achievements;
}

function renderAchievements(games) {
  const list = document.getElementById('achievementList');
  if (!list) return;

  const achievements = getAchievements(games);
  list.innerHTML = achievements.map((achievement) => `
    <li class="achievement-item">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-copy">
        <strong>${achievement.title}</strong>
        <span>${achievement.text}</span>
      </div>
    </li>
  `).join('');

  const milestones = document.getElementById('milestoneList');
  if (!milestones) return;

  const total = games.length;
  const completed = games.filter((game) => game.status === 'completed').length;
  const totalHours = games.reduce((sum, game) => sum + (Number(game.hoursPlayed) || 0), 0);

  const milestoneTargets = [
    { label: '1 game', reached: total >= 1, value: total },
    { label: '3 completed', reached: completed >= 3, value: completed },
    { label: '25h logged', reached: totalHours >= 25, value: totalHours },
    { label: '5 total', reached: total >= 5, value: total },
  ];

  milestones.innerHTML = milestoneTargets.map((item) => {
    const suffix = item.label.includes('h') ? 'h' : '';
    const displayValue = item.label.includes('game') || item.label.includes('total') ? `${item.value}` : `${item.value}${suffix}`;
    return `
      <li class="achievement-item">
        <div class="achievement-icon">${item.reached ? '✓' : '•'}</div>
        <div class="achievement-copy">
          <strong>${item.label}</strong>
          <span>${item.reached ? 'Unlocked' : `Current: ${displayValue}`}</span>
        </div>
      </li>
    `;
  }).join('');
}

function renderActivity(games) {
  const list = document.getElementById('activityList');
  if (!list) return;

  const activityItems = [...games]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)
    .map((game) => {
      const statusText = game.status ? game.status.charAt(0).toUpperCase() + game.status.slice(1) : 'Backlog';
      const createdAt = game.createdAt ? new Date(game.createdAt) : new Date();
      const timeLabel = createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return `
        <li class="activity-item">
          <span class="activity-dot"></span>
          <div>
            <strong>${game.title}</strong>
            <small>${statusText} • ${timeLabel}</small>
          </div>
        </li>
      `;
    });

  list.innerHTML = activityItems.length ? activityItems.join('') : '<li class="activity-item"><span class="activity-dot"></span><div><strong>No recent activity yet</strong><small>Add your first game to get started.</small></div></li>';
}

function bindProfileEditor() {
  const modal = document.getElementById('profile-settings-modal');
  const openBtn = document.getElementById('openProfileSettings');
  const closeBtn = document.getElementById('closeProfileSettings');
  const cancelBtn = document.getElementById('cancelProfileSettings');
  const form = document.getElementById('profile-settings-form');

  if (!modal || !form) return;

  openBtn?.addEventListener('click', () => {
    const { bio, customPlatform } = getProfileData();
    document.getElementById('profile-bio-input').value = bio === 'No bio yet — write a short description about your playstyle.' ? '' : bio;
    document.getElementById('profile-platform-input').value = customPlatform || 'PC';
    modal.classList.remove('hidden');
  });

  const close = () => {
    modal.classList.add('hidden');
  };

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const bio = document.getElementById('profile-bio-input').value.trim();
    const platform = document.getElementById('profile-platform-input').value;

    localStorage.setItem('profileBio', bio || 'No bio yet — write a short description about your playstyle.');
    localStorage.setItem('profilePlatform', platform || 'PC');
    close();
    loadGames();
  });
}

function bindAddGameForm() {
  const form = document.getElementById('add-game-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideGamesError();

    const titleInput = document.getElementById('game-title');
    const statusSelect = document.getElementById('game-status');
    const platformSelect = document.getElementById('game-platform');
    const hoursInput = document.getElementById('game-hours');
    const completionInput = document.getElementById('game-completion');
    const notesInput = document.getElementById('game-notes');

    const title = titleInput.value.trim();
    const status = statusSelect.value;
    const platform = platformSelect.value;
    const hoursPlayed = hoursInput.value === '' ? 0 : Number(hoursInput.value);
    const completion = completionInput.value === '' ? 0 : Number(completionInput.value);
    const notes = notesInput.value.trim();

    if (!title) {
      showGamesError('Enter a game title first.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/games`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, status, platform, hoursPlayed, completion, notes }),
      });
      if (handleAuthFailure(response)) return;

      const data = await response.json();
      if (!response.ok) {
        showGamesError(data.message || 'Could not add that game.');
        return;
      }

      titleInput.value = '';
      statusSelect.value = 'playing';
      platformSelect.value = 'PC';
      hoursInput.value = '';
      completionInput.value = '';
      notesInput.value = '';
      loadGames();
    } catch (err) {
      console.error('Add game error:', err);
      showGamesError("Couldn't reach the server. Please try again.");
    }
  });
}

function bindEditModal() {
  const modal = document.getElementById('edit-modal');
  const closeBtn = document.getElementById('closeEditModal');
  const cancelBtn = document.getElementById('cancelEditGame');
  const form = document.getElementById('edit-game-form');

  if (!modal || !form) return;

  closeBtn?.addEventListener('click', closeEditModal);
  cancelBtn?.addEventListener('click', closeEditModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeEditModal();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentEditingGameId) return;

    const title = document.getElementById('edit-game-title').value.trim();
    const status = document.getElementById('edit-game-status').value;
    const platform = document.getElementById('edit-game-platform').value;
    const hoursPlayed = Number(document.getElementById('edit-game-hours').value || 0);
    const completion = Number(document.getElementById('edit-game-completion').value || 0);
    const notes = document.getElementById('edit-game-notes').value.trim();

    if (!title) {
      showGamesError('Game title cannot be empty.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/games/${currentEditingGameId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ title, status, platform, hoursPlayed, completion, notes }),
      });
      if (handleAuthFailure(response)) return;

      const data = await response.json();
      if (!response.ok) {
        showGamesError(data.message || 'Could not update that game.');
        return;
      }

      closeEditModal();
      loadGames();
    } catch (err) {
      console.error('Edit game error:', err);
      showGamesError("Couldn't reach the server. Please try again.");
    }
  });
}

function openEditModal(game) {
  currentEditingGameId = game.id;
  const modal = document.getElementById('edit-modal');
  if (!modal) return;

  document.getElementById('edit-game-title').value = game.title || '';
  document.getElementById('edit-game-status').value = game.status || 'backlog';
  document.getElementById('edit-game-platform').value = game.platform || 'PC';
  document.getElementById('edit-game-hours').value = Number(game.hoursPlayed || 0);
  document.getElementById('edit-game-completion').value = Number(game.completion || 0);
  document.getElementById('edit-game-notes').value = game.notes || '';

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentEditingGameId = null;
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

    const cover = document.createElement('div');
    cover.className = 'game-cover';
    cover.style.background = getGameGradient(game.title || 'G');
    cover.textContent = (game.title || 'G').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

    const main = document.createElement('div');
    main.className = 'game-item-main';

    const header = document.createElement('div');
    header.className = 'game-item-header';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'game-item-title';
    titleSpan.textContent = game.title;

    const statusPill = document.createElement('span');
    statusPill.className = `game-status-pill ${game.status || 'backlog'}`;
    statusPill.textContent = game.status || 'Backlog';

    header.appendChild(titleSpan);
    header.appendChild(statusPill);

    const meta = document.createElement('div');
    meta.className = 'game-item-meta';
    const platform = game.platform || 'PC';
    const hours = Number(game.hoursPlayed) || 0;
    const completion = Number(game.completion) || 0;
    meta.innerHTML = `
      <span>Platform: ${platform}</span>
      <span>Hours: ${hours}h</span>
      <span>Progress: ${completion}%</span>
    `;

    const progress = document.createElement('div');
    progress.className = 'game-progress';
    const progressFill = document.createElement('span');
    progressFill.style.width = `${Math.min(100, Math.max(0, completion))}%`;
    progress.appendChild(progressFill);

    const notes = document.createElement('div');
    notes.className = 'game-item-notes';
    if (game.notes) {
      notes.textContent = game.notes;
    } else {
      notes.textContent = 'No notes yet.';
      notes.style.opacity = '0.6';
    }

    main.appendChild(header);
    main.appendChild(meta);
    main.appendChild(progress);
    main.appendChild(notes);

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

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-game-btn';
    editBtn.setAttribute('aria-label', 'Edit ' + game.title);
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>';
    editBtn.addEventListener('click', () => openEditModal(game));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-game-btn';
    deleteBtn.setAttribute('aria-label', 'Delete ' + game.title);
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    deleteBtn.addEventListener('click', () => deleteGameById(game.id));

    controls.appendChild(statusSelect);
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(cover);
    li.appendChild(main);
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