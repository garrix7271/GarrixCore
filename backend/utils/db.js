// utils/db.js — a minimal JSON-file "database" for users.
// Good for learning/testing. Swap this out for a real database
// (Postgres, MongoDB, etc.) before handling real user data.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'users.json');

function readUsers() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeUsers(users) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function findUserByEmail(email) {
  const users = readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function createUser(user) {
  const users = readUsers();
  users.push(user);
  writeUsers(users);
  return user;
}

function updateUser(email, updates) {
  const users = readUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  writeUsers(users);
  return users[index];
}

function findUserByResetToken(token) {
  const users = readUsers();
  return users.find((u) => u.resetToken === token);
}

// --- Saved games ---

const GAMES_DB_PATH = path.join(__dirname, '..', 'data', 'games.json');

function readGames() {
  if (!fs.existsSync(GAMES_DB_PATH)) {
    fs.writeFileSync(GAMES_DB_PATH, JSON.stringify([], null, 2));
  }
  const raw = fs.readFileSync(GAMES_DB_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeGames(games) {
  fs.writeFileSync(GAMES_DB_PATH, JSON.stringify(games, null, 2));
}

function findGamesByUserId(userId) {
  const games = readGames();
  return games.filter((g) => g.userId === userId);
}

function createGame(game) {
  const games = readGames();
  games.push(game);
  writeGames(games);
  return game;
}

function updateGame(id, userId, updates) {
  const games = readGames();
  const index = games.findIndex((g) => g.id === id && g.userId === userId);
  if (index === -1) return null;
  games[index] = { ...games[index], ...updates };
  writeGames(games);
  return games[index];
}

function deleteGame(id, userId) {
  const games = readGames();
  const index = games.findIndex((g) => g.id === id && g.userId === userId);
  if (index === -1) return false;
  games.splice(index, 1);
  writeGames(games);
  return true;
}

module.exports = {
  readUsers,
  writeUsers,
  findUserByEmail,
  createUser,
  updateUser,
  findUserByResetToken,
  readGames,
  writeGames,
  findGamesByUserId,
  createGame,
  updateGame,
  deleteGame,
};