const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/notes'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/body-metrics', require('./routes/bodyMetrics'));
app.use('/api/goals', require('./routes/goals'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Server error' });
});

if (require.main === module) {
  app.listen(port, async () => {
    console.log(`API on ${port}`);
    try {
      const db = require('./db');
      const [columns] = await db.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = 'workouts'
           AND column_name = 'completed'`
      );
      if (!columns.length) {
        await db.query(
          'ALTER TABLE workouts ADD COLUMN completed BOOLEAN NOT NULL DEFAULT FALSE AFTER notes'
        );
        console.log('Database migration applied: workouts.completed');
      }
      await db.query('SELECT 1');
      console.log('Database connection ready');
    } catch (err) {
      console.error('Database connection failed:', err.message);
    }
  });
}

module.exports = app;

//perus palvelin - Abu