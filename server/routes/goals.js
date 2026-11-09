const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY target_date IS NULL, target_date',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const { type, targetValue, targetDate = null } = req.body;
  if (!['weight', 'lift', 'workouts_per_week'].includes(type) || targetValue === undefined) {
    return res.status(400).json({ error: 'Valid type and targetValue are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO goals (user_id, type, target_value, target_date) VALUES (?, ?, ?, ?)',
      [req.user.id, type, targetValue, targetDate]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  const achievedAt = req.body.achieved ? new Date() : null;
  try {
    const [result] = await db.execute(
      'UPDATE goals SET achieved_at = ? WHERE id = ? AND user_id = ?',
      [achievedAt, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
