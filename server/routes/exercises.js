const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, user_id, name, muscle_group FROM exercises WHERE user_id IS NULL OR user_id = ? ORDER BY name',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const muscleGroup = typeof req.body.muscleGroup === 'string'
    ? req.body.muscleGroup.trim()
    : null;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const [result] = await db.execute(
      'INSERT INTO exercises (user_id, name, muscle_group) VALUES (?, ?, ?)',
      [req.user.id, name, muscleGroup || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM exercises WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
