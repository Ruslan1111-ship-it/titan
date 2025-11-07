import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить расписание на период
router.get('/', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date, client_id, status } = req.query;

    let query = `
      SELECT 
        ts.*,
        c.full_name as client_name,
        c.phone as client_phone,
        cm.type_name,
        cm.remaining_sessions
      FROM training_schedule ts
      JOIN clients c ON ts.client_id = c.id
      JOIN (
        SELECT 
          cm.id,
          cm.remaining_sessions,
          mt.name as type_name
        FROM client_memberships cm
        JOIN membership_types mt ON cm.membership_type_id = mt.id
      ) cm ON ts.membership_id = cm.id
      WHERE 1=1
    `;

    const params = [];

    if (start_date) {
      query += ' AND ts.scheduled_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND ts.scheduled_date <= ?';
      params.push(end_date);
    }

    if (client_id) {
      query += ' AND ts.client_id = ?';
      params.push(client_id);
    }

    if (status) {
      query += ' AND ts.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ts.scheduled_date ASC, ts.scheduled_time ASC';

    const schedule = db.prepare(query).all(...params);

    res.json(schedule);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Ошибка получения расписания' });
  }
});

// Создать тренировку в расписании
router.post('/', authenticateToken, (req, res) => {
  try {
    const { client_id, membership_id, scheduled_date, scheduled_time, duration_minutes, notes } = req.body;

    if (!client_id || !membership_id || !scheduled_date || !scheduled_time) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // Проверяем, что у абонемента есть оставшиеся тренировки
    const membership = db.prepare('SELECT remaining_sessions FROM client_memberships WHERE id = ?').get(membership_id);
    
    if (!membership || membership.remaining_sessions <= 0) {
      return res.status(400).json({ error: 'У абонемента нет оставшихся тренировок' });
    }

    const result = db.prepare(`
      INSERT INTO training_schedule 
      (client_id, membership_id, scheduled_date, scheduled_time, duration_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      client_id,
      membership_id,
      scheduled_date,
      scheduled_time,
      duration_minutes || 60,
      notes || null
    );

    const newTraining = db.prepare(`
      SELECT 
        ts.*,
        c.full_name as client_name,
        c.phone as client_phone
      FROM training_schedule ts
      JOIN clients c ON ts.client_id = c.id
      WHERE ts.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newTraining);
  } catch (error) {
    console.error('Create training error:', error);
    res.status(500).json({ error: 'Ошибка создания тренировки' });
  }
});

// Отметить тренировку как выполненную
router.put('/:id/complete', authenticateToken, (req, res) => {
  try {
    const { notes } = req.body;
    const trainingId = req.params.id;

    // Получаем тренировку
    const training = db.prepare('SELECT * FROM training_schedule WHERE id = ?').get(trainingId);
    
    if (!training) {
      return res.status(404).json({ error: 'Тренировка не найдена' });
    }

    if (training.status === 'completed') {
      return res.status(400).json({ error: 'Тренировка уже отмечена как выполненная' });
    }

    const completedDate = new Date().toISOString().split('T')[0];

    // Обновляем статус тренировки
    db.prepare(`
      UPDATE training_schedule 
      SET status = 'completed', completed_date = ?, notes = ?
      WHERE id = ?
    `).run(completedDate, notes || training.notes, trainingId);

    // Уменьшаем количество оставшихся тренировок в абонементе
    db.prepare(`
      UPDATE client_memberships 
      SET remaining_sessions = remaining_sessions - 1
      WHERE id = ?
    `).run(training.membership_id);

    // Добавляем запись в историю
    db.prepare(`
      INSERT INTO training_history 
      (client_id, membership_id, training_date, training_time, duration_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      training.client_id,
      training.membership_id,
      training.scheduled_date,
      training.scheduled_time,
      training.duration_minutes,
      notes || training.notes
    );

    // Проверяем, не закончились ли тренировки
    const membership = db.prepare('SELECT remaining_sessions FROM client_memberships WHERE id = ?').get(training.membership_id);
    if (membership.remaining_sessions <= 0) {
      db.prepare('UPDATE client_memberships SET is_active = 0 WHERE id = ?').run(training.membership_id);
    }

    const updated = db.prepare(`
      SELECT 
        ts.*,
        c.full_name as client_name,
        c.phone as client_phone
      FROM training_schedule ts
      JOIN clients c ON ts.client_id = c.id
      WHERE ts.id = ?
    `).get(trainingId);

    res.json(updated);
  } catch (error) {
    console.error('Complete training error:', error);
    res.status(500).json({ error: 'Ошибка отметки тренировки' });
  }
});

// Отменить тренировку
router.put('/:id/cancel', authenticateToken, (req, res) => {
  try {
    const { notes } = req.body;

    db.prepare(`
      UPDATE training_schedule 
      SET status = 'cancelled', notes = ?
      WHERE id = ?
    `).run(notes || null, req.params.id);

    const updated = db.prepare(`
      SELECT 
        ts.*,
        c.full_name as client_name
      FROM training_schedule ts
      JOIN clients c ON ts.client_id = c.id
      WHERE ts.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error('Cancel training error:', error);
    res.status(500).json({ error: 'Ошибка отмены тренировки' });
  }
});

// Удалить тренировку из расписания
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM training_schedule WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Тренировка не найдена' });
    }

    res.json({ message: 'Тренировка удалена из расписания' });
  } catch (error) {
    console.error('Delete training error:', error);
    res.status(500).json({ error: 'Ошибка удаления тренировки' });
  }
});

// Получить историю тренировок клиента
router.get('/history/:clientId', authenticateToken, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT 
        th.*,
        c.full_name as client_name
      FROM training_history th
      JOIN clients c ON th.client_id = c.id
      WHERE th.client_id = ?
      ORDER BY th.training_date DESC, th.training_time DESC
    `).all(req.params.clientId);

    res.json(history);
  } catch (error) {
    console.error('Get training history error:', error);
    res.status(500).json({ error: 'Ошибка получения истории тренировок' });
  }
});

export default router;
