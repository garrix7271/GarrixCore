// controllers/games.controller.js — CRUD for a signed-in user's saved games list.

const crypto = require('crypto');
const {
  findGamesByUserId,
  createGame,
  updateGame,
  deleteGame,
} = require('../utils/db');

const VALID_STATUSES = ['playing', 'completed', 'backlog'];

function normalizeHours(value) {
  if (value === undefined || value === null || value === '') return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error('Hours played must be a valid number.');
  }
  return Math.max(0, numeric);
}

function normalizeCompletion(value) {
  if (value === undefined || value === null || value === '') return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error('Completion must be a valid number between 0 and 100.');
  }
  return Math.min(100, Math.max(0, numeric));
}

// GET /api/games
function listGames(req, res) {
  const games = findGamesByUserId(req.userId);
  return res.status(200).json({ games });
}

// POST /api/games
function addGame(req, res) {
  const { title, status, platform, hoursPlayed, completion, notes } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Game title is required.' });
  }

  try {
    const finalStatus = VALID_STATUSES.includes(status) ? status : 'backlog';
    const finalPlatform = platform ? String(platform).trim() : 'PC';
    const finalHours = normalizeHours(hoursPlayed);
    const finalCompletion = normalizeCompletion(completion);
    const finalNotes = notes !== undefined && notes !== null ? String(notes).trim() : '';

    const game = createGame({
      id: crypto.randomUUID(),
      userId: req.userId,
      title: title.trim(),
      status: finalStatus,
      platform: finalPlatform,
      hoursPlayed: finalHours,
      completion: finalCompletion,
      notes: finalNotes,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ game });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// PATCH /api/games/:id
function editGame(req, res) {
  const { id } = req.params;
  const { title, status, platform, hoursPlayed, completion, notes } = req.body;

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
  if (platform !== undefined) {
    updates.platform = platform ? String(platform).trim() : 'PC';
  }
  if (hoursPlayed !== undefined) {
    try {
      updates.hoursPlayed = normalizeHours(hoursPlayed);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
  if (completion !== undefined) {
    try {
      updates.completion = normalizeCompletion(completion);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
  if (notes !== undefined) {
    updates.notes = notes !== null ? String(notes).trim() : '';
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