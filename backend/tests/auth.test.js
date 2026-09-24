const test = require('node:test');
const assert = require('node:assert/strict');

const { forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { writeUsers, readUsers } = require('../utils/db');

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

test('forgotPassword stores a reset token for an existing user', async () => {
  writeUsers([
    {
      id: 'user-1',
      name: 'Test User',
      email: 'user@example.com',
      passwordHash: 'hash',
      createdAt: new Date().toISOString(),
    },
  ]);

  const req = {
    body: { email: 'user@example.com' },
    headers: { origin: 'http://127.0.0.1:5500' },
  };
  const res = makeRes();

  await forgotPassword(req, res);

  assert.equal(res.statusCode, 200);
  const user = readUsers().find((entry) => entry.email === 'user@example.com');
  assert.ok(user.resetToken);
  assert.ok(user.resetTokenExpires);
});

test('resetPassword updates the password when the reset token is valid', async () => {
  const now = Date.now();
  writeUsers([
    {
      id: 'user-2',
      name: 'Reset User',
      email: 'reset@example.com',
      passwordHash: 'old-hash',
      resetToken: 'token-123',
      resetTokenExpires: now + 60 * 60 * 1000,
      createdAt: new Date().toISOString(),
    },
  ]);

  const req = {
    body: {
      token: 'token-123',
      password: 'new-password-123',
    },
  };
  const res = makeRes();

  await resetPassword(req, res);

  assert.equal(res.statusCode, 200);
  const user = readUsers().find((entry) => entry.email === 'reset@example.com');
  assert.notEqual(user.passwordHash, 'old-hash');
  assert.equal(user.resetToken, null);
  assert.equal(user.resetTokenExpires, null);
});
