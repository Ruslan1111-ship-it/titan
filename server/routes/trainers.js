import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить всех тренеров
router.get('/', authenticateToken, (req, res) => {
  try {
    const trainers = db.prepare(`
      SELECT 
        t.*,
        COUNT(DISTINCT c.id) as client_count
      FROM trainers t
      LEFT JOIN clients c ON c.trainer_id = t.id AND c.membership_active = 1
      GROUP BY t.id
      ORDER BY t.full_name
    `).all();

    res.json(trainers);
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({ error: 'Ошибка получения списка тренеров' });
  }
});

// Получить тренера по ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const trainer = db.prepare('SELECT * FROM trainers WHERE id = ?').get(req.params.id);

    if (!trainer) {
      return res.status(404).json({ error: 'Тренер не найден' });
    }

    res.json(trainer);
  } catch (error) {
    console.error('Get trainer error:', error);
    res.status(500).json({ error: 'Ошибка получения данных тренера' });
  }
});

// Создать тренера
router.post('/', authenticateToken, (req, res) => {
  try {
    const { full_name, phone, specialization } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'Укажите ФИО и телефон' });
    }

    const uuid = uuidv4();
    const result = db.prepare(`
      INSERT INTO trainers (uuid, full_name, phone, specialization)
      VALUES (?, ?, ?, ?)
    `).run(uuid, full_name, phone, specialization || null);

    const trainer = db.prepare('SELECT * FROM trainers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(trainer);
  } catch (error) {
    console.error('Create trainer error:', error);
    res.status(500).json({ error: 'Ошибка создания тренера' });
  }
});

// Обновить тренера
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { full_name, phone, specialization } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'Укажите ФИО и телефон' });
    }

    db.prepare(`
      UPDATE trainers
      SET full_name = ?, phone = ?, specialization = ?
      WHERE id = ?
    `).run(full_name, phone, specialization || null, req.params.id);

    const trainer = db.prepare('SELECT * FROM trainers WHERE id = ?').get(req.params.id);

    if (!trainer) {
      return res.status(404).json({ error: 'Тренер не найден' });
    }

    res.json(trainer);
  } catch (error) {
    console.error('Update trainer error:', error);
    res.status(500).json({ error: 'Ошибка обновления тренера' });
  }
});

// Удалить тренера
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM trainers WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Тренер не найден' });
    }

    res.json({ message: 'Тренер успешно удалён' });
  } catch (error) {
    console.error('Delete trainer error:', error);
    res.status(500).json({ error: 'Ошибка удаления тренера' });
  }
});

export default router;
