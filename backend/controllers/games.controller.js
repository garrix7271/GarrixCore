// controllers/games.controller.js — CRUD for a signed-in user's saved games list.

const crypto = require('crypto');
const {
  findGamesByUserId,
  createGame,
  updateGame,
  deleteGame,
} = require('../utils/db');

const VALID_STATUSES = ['playing', 'completed', 'backlog'];

// GET /api/games
function listGames(req, res) {
  const games = findGamesByUserId(req.userId);
  return res.status(200).json({ games });
}

// POST /api/games
function addGame(req, res) {
  const { title, status } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Game title is required.' });
  }

  const finalStatus = VALID_STATUSES.includes(status) ? status : 'backlog';

  const game = createGame({
    id: crypto.randomUUID(),
    userId: req.userId,
    title: title.trim(),
    status: finalStatus,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ game });
}

// PATCH /api/games/:id
function editGame(req, res) {
  const { id } = req.params;
  const { title, status } = req.body;

  const updates = {};
  if (title !== undefined) {
    if (!title.trim()) {
      return res.status(400).json({ message: 'Game title cannot be empty.' });
    }
    updates.title = title.trim();
  }
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    updates.status = status;
  }

  const updated = updateGame(id, req.userId, updates);
  if (!updated) {
    return res.status(404).json({ message: 'Game not found.' });
  }

  return res.status(200).json({ game: updated });
}

// DELETE /api/games/:id
function removeGame(req, res) {
  const { id } = req.params;
  const deleted = deleteGame(id, req.userId);
  if (!deleted) {
    return res.status(404).json({ message: 'Game not found.' });
  }
  return res.status(200).json({ message: 'Deleted.' });
}

module.exports = { listGames, addGame, editGame, removeGame };