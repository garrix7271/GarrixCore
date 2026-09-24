const test = require('node:test');
const assert = require('node:assert/strict');

const { addGame, editGame } = require('../controllers/games.controller');
const { writeGames } = require('../utils/db');

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('addGame stores platform, hoursPlayed, completion and notes metadata', () => {
  writeGames([]);

  const req = {
    userId: 'user-1',
    body: {
      title: 'Hades',
      status: 'playing',
      platform: 'PC',
      hoursPlayed: 12.5,
      completion: 40,
      notes: 'Great run so far',
    },
  };

  const res = makeRes();
  addGame(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.game.title, 'Hades');
  assert.equal(res.body.game.platform, 'PC');
  assert.equal(res.body.game.hoursPlayed, 12.5);
  assert.equal(res.body.game.completion, 40);
  assert.equal(res.body.game.notes, 'Great run so far');
});

test('editGame updates existing metadata values', () => {
  writeGames([
    {
      id: 'game-1',
      userId: 'user-1',
      title: 'Elden Ring',
      status: 'backlog',
      platform: 'PC',
      hoursPlayed: 0,
      completion: 0,
      notes: '',
      createdAt: new Date().toISOString(),
    },
  ]);

  const req = {
    userId: 'user-1',
    params: { id: 'game-1' },
    body: {
      status: 'completed',
      platform: 'PlayStation 5',
      hoursPlayed: 52,
      completion: 100,
      notes: 'Finished the main story',
    },
  };

  const res = makeRes();
  editGame(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.game.status, 'completed');
  assert.equal(res.body.game.platform, 'PlayStation 5');
  assert.equal(res.body.game.hoursPlayed, 52);
  assert.equal(res.body.game.completion, 100);
  assert.equal(res.body.game.notes, 'Finished the main story');
});
