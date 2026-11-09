const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth); 

router.get('/', async (req, res, next) => {
  try {
    const { from = '1970-01-01', to = '2999-12-31' } = req.query;
    const [rows] = await db.execute(
      `SELECT w.*, COUNT(s.id) AS exercises
       FROM workouts w
       LEFT JOIN workout_sets s ON s.workout_id = w.id
       WHERE w.user_id = ? AND w.performed_on BETWEEN ? AND ?
       GROUP BY w.id
       ORDER BY w.performed_on DESC`,
      [req.user.id, from, to]
    );
    res.json(rows.map((workout) => ({
      ...workout,
      exercises: Number(workout.exercises),
      completed: Boolean(workout.completed),
    })));
  } catch (err) { next(err); }
});

// Get one workout with its sets
router.get('/:id', async (req, res, next) => {
  try {
    const [[workout]] = await db.execute(
      'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!workout) return res.status(404).json({ error: 'Not found' });

    const [sets] = await db.execute(
      `SELECT s.*, e.name AS exercise_name FROM workout_sets s
       JOIN exercises e ON e.id = s.exercise_id
       WHERE s.workout_id = ? ORDER BY s.exercise_id, s.set_number`,
      [workout.id]
    );
    res.json({ ...workout, sets });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { name, performedOn, durationMin, notes, completed = false, sets = [] } = req.body;
    if (!name || !performedOn)
      return res.status(400).json({ error: 'name and performedOn required' });
    if (!Array.isArray(sets))
      return res.status(400).json({ error: 'sets must be an array' });

    await conn.beginTransaction();
    const [r] = await conn.execute(
      'INSERT INTO workouts (user_id, name, performed_on, duration_min, notes, completed) VALUES (?,?,?,?,?,?)',
      [req.user.id, name, performedOn, durationMin ?? null, notes ?? null, Boolean(completed)]
    );
    for (const s of sets) {
      const [[exercise]] = await conn.execute(
        'SELECT id FROM exercises WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
        [s.exerciseId, req.user.id]
      );
      if (!exercise) {
        await conn.rollback();
        return res.status(400).json({ error: 'Exercise is not available to this user' });
      }
      await conn.execute(
        'INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg) VALUES (?,?,?,?,?)',
        [r.insertId, s.exerciseId, s.setNumber, s.reps ?? null, s.weightKg ?? null]
      );
    }
    await conn.commit();
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const fields = [];
    const values = [];
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      fields.push('name = ?');
      values.push(req.body.name.trim());
    }
    if (typeof req.body.completed === 'boolean') {
      fields.push('completed = ?');
      values.push(req.body.completed);
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid fields provided' });

    values.push(req.params.id, req.user.id);
    const [result] = await db.execute(
      `UPDATE workouts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [r] = await db.execute(
      'DELETE FROM workouts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;