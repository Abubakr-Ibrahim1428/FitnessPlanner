const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY recorded_on DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/:recordedOn', async (req, res, next) => {
  const { weightKg = null, bodyFatPct = null } = req.body;
  if (weightKg === null && bodyFatPct === null) {
    return res.status(400).json({ error: 'At least one metric is required' });
  }

  try {
    await db.execute(
      `INSERT INTO body_metrics (user_id, recorded_on, weight_kg, body_fat_pct)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), body_fat_pct = VALUES(body_fat_pct)`,
      [req.user.id, req.params.recordedOn, weightKg, bodyFatPct]
    );
    res.status(204).end();
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM body_metrics WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
