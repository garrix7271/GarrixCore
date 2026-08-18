// routes/games.routes.js — all routes here require a valid login token.

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const {
  listGames,
  addGame,
  editGame,
  removeGame,
} = require('../controllers/games.controller');

router.use(requireAuth);

router.get('/', listGames);
router.post('/', addGame);
router.patch('/:id', editGame);
router.delete('/:id', removeGame);

module.exports = router;