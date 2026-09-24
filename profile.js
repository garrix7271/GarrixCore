const API_BASE = 'https://garrixcore.onrender.com/api';

const DEFAULT_BIO = 'No bio yet — write a short description about your playstyle.';

if (!localStorage.getItem('authToken')) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  bindLogout();
  bindProfileForm();
  loadProfileData();
});

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + localStorage.getItem('authToken'),
  };
}

function handleAuthFailure(response) {
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
    return true;
  }
  return false;
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

function getProfileData() {
  return {
    name: localStorage.getItem('userName') || 'Gamer',
    bio: localStorage.getItem('profileBio') || DEFAULT_BIO,
    platform: localStorage.getItem('profilePlatform') || 'PC',
  };
}

function applyProfileHero() {
  const profile = getProfileData();
  const avatar = document.getElementById('profileHeroAvatar');
  const heroName = document.getElementById('profileHeroName');
  const heroBio = document.getElementById('profileHeroBio');
  const heroPlatform = document.getElementById('profileHeroPlatform');
  const aboutText = document.getElementById('profileAboutText');

  const firstName = profile.name.split(' ')[0];

  if (avatar) avatar.textContent = firstName.slice(0, 2).toUpperCase();
  if (heroName) heroName.textContent = firstName;
  if (heroBio) heroBio.textContent = profile.bio;
  if (heroPlatform) heroPlatform.textContent = profile.platform;
  if (aboutText) aboutText.textContent = profile.bio;

  const nameInput = document.getElementById('profile-name-input');
  const bioInput = document.getElementById('profile-bio-input');
  const platformInput = document.getElementById('profile-platform-input');

  if (nameInput) nameInput.value = profile.name;
  if (bioInput) bioInput.value = profile.bio === DEFAULT_BIO ? '' : profile.bio;
  if (platformInput) platformInput.value = profile.platform;
}

function bindProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('profile-name-input');
    const bioInput = document.getElementById('profile-bio-input');
    const platformInput = document.getElementById('profile-platform-input');

    const name = (nameInput.value || '').trim() || 'Gamer';
    const bio = (bioInput.value || '').trim() || DEFAULT_BIO;
    const platform = platformInput.value || 'PC';

    localStorage.setItem('userName', name);
    localStorage.setItem('profileBio', bio);
    localStorage.setItem('profilePlatform', platform);

    applyProfileHero();
    loadProfileData();
  });
}

async function loadProfileData() {
  try {
    const response = await fetch(`${API_BASE}/games`, { headers: authHeaders() });
    if (handleAuthFailure(response)) return;

    const data = await response.json();
    if (!response.ok) {
      console.error(data.message || 'Could not load games.');
      return;
    }

    const games = data.games || [];
    renderStats(games);
    renderRecentGames(games);
    applyProfileHero();
  } catch (error) {
    console.error('Profile load error:', error);
  }
}

function renderStats(games) {
  const totalGames = games.length;
  const totalHours = games.reduce((sum, game) => sum + (Number(game.hoursPlayed) || 0), 0);
  const completed = games.filter((game) => game.status === 'completed').length;
  const avgCompletion = totalGames
    ? Math.round(games.reduce((sum, game) => sum + (Number(game.completion) || 0), 0) / totalGames)
    : 0;

  document.getElementById('profileTotalGames').textContent = totalGames;
  document.getElementById('profileHoursLogged').textContent = `${Math.round(totalHours)}h`;
  document.getElementById('profileCompletionAvg').textContent = `${avgCompletion}%`;
  document.getElementById('profileCompletedCount').textContent = completed;
}

function renderRecentGames(games) {
  const list = document.getElementById('recentGamesList');
  if (!list) return;

  const recentGames = [...games]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  if (!recentGames.length) {
    list.innerHTML = '<li class="recent-games-item"><div><strong>No games yet</strong><small>Add something to your library.</small></div><span>0%</span></li>';
    return;
  }

  list.innerHTML = recentGames.map((game) => `
    <li class="recent-games-item">
      <div>
        <strong>${game.title}</strong>
        <small>${game.platform || 'PC'} • ${game.status || 'backlog'}</small>
      </div>
      <span>${Number(game.completion) || 0}%</span>
    </li>
  `).join('');
}
