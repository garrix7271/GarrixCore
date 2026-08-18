# GarrixCore Backend

A small Express API that powers the sign in / sign up / forgot password / reset password forms in the GarrixCore frontend.

## What's inside

| File | Purpose |
|---|---|
| `server.js` | Starts the server, sets up CORS and JSON parsing |
| `routes/auth.routes.js` | Maps `/api/...` URLs to controller functions |
| `controllers/auth.controller.js` | The actual signup/login/reset logic |
| `utils/db.js` | Reads/writes `data/users.json` as a simple file-based database |
| `data/users.json` | Where user accounts are stored (gitignored — don't commit real user data) |

## Running it locally

**1. Install Node.js** (v18 or newer) if you don't have it — [nodejs.org](https://nodejs.org)

**2. Install dependencies**
