// server.js — entry point. Starts the Express app.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const gamesRoutes = require('./routes/games.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl or Postman) and any origin
      // explicitly listed in ALLOWED_ORIGINS.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'GarrixCore auth API is running.' });
});

app.use('/api', authRoutes);
app.use('/api/games', gamesRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

app.listen(PORT, () => {
  console.log(`GarrixCore backend running at http://localhost:${PORT}`);
});