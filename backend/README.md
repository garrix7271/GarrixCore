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

## Email reset setup

To send real password-reset emails, create a backend/.env file based on the example below:

```bash
cp .env.example .env
```

Then fill in the values:

```env
PORT=3000
JWT_SECRET=change-me
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
FRONTEND_URL=http://127.0.0.1:5500
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
```

The reset flow will send an email through Resend whenever a user requests a password reset. If `RESEND_API_KEY` is missing, the app falls back to logging the reset link in the terminal for local development.

## Running it locally

**1. Install Node.js** (v18 or newer) if you don't have it — [nodejs.org](https://nodejs.org)

**2. Install dependencies**
