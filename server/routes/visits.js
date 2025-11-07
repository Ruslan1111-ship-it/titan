import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить все посещения
router.get('/', authenticateToken, (req, res) => {
  try {
    const { client_id, start_date, end_date, limit = 100 } = req.query;

    let query = `
      SELECT 
        v.*,
        c.full_name as client_name,
        c.phone as client_phone,
        t.full_name as trainer_name
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN trainers t ON c.trainer_id = t.id
      WHERE 1=1
    `;

    const params = [];

    if (client_id) {
      query += ' AND v.client_id = ?';
      params.push(client_id);
    }

    if (start_date) {
      query += ' AND v.check_in_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND v.check_in_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY v.check_in_date DESC, v.check_in_time DESC LIMIT ?';
    params.push(parseInt(limit));

    const visits = db.prepare(query).all(...params);

    res.json(visits);
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Ошибка получения списка посещений' });
  }
});

// Зарегистрировать вход/выход (сканирование QR-кода)
router.post('/checkin', async (req, res) => {
  try {
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({ error: 'UUID не указан' });
    }

    // Найти клиента по UUID
    const client = db.prepare(`
      SELECT 
        c.*,
        t.full_name as trainer_name,
        t.phone as trainer_phone,
        t.specialization as trainer_specialization
      FROM clients c
      LEFT JOIN trainers t ON c.trainer_id = t.id
      WHERE c.uuid = ?
    `).get(uuid);

    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    // Проверить статус абонемента
    if (!client.membership_active) {
      return res.status(403).json({ 
        error: 'Абонемент неактивен',
        client: {
          id: client.id,
          full_name: client.full_name,
          phone: client.phone,
          membership_active: false,
          membership_end_date: client.membership_end_date,
        }
      });
    }

    // Проверить дату окончания абонемента
    if (client.membership_end_date) {
      const endDate = new Date(client.membership_end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (endDate < today) {
        return res.status(403).json({ 
          error: 'Срок действия абонемента истёк',
          client: {
            id: client.id,
            full_name: client.full_name,
            phone: client.phone,
            membership_active: client.membership_active,
            membership_end_date: client.membership_end_date,
          }
        });
      }
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    // Проверить, есть ли активное посещение (вход без выхода)
    const activeVisit = db.prepare(`
      SELECT * FROM visits 
      WHERE client_id = ? AND check_out_date IS NULL
      ORDER BY check_in_date DESC, check_in_time DESC
      LIMIT 1
    `).get(client.id);

    let visit, action;

    if (activeVisit) {
      // Это выход - обновляем запись
      const checkInDateTime = new Date(`${activeVisit.check_in_date}T${activeVisit.check_in_time}`);
      const checkOutDateTime = new Date(`${currentDate}T${currentTime}`);
      const durationMinutes = Math.round((checkOutDateTime - checkInDateTime) / 60000);

      db.prepare(`
        UPDATE visits 
        SET check_out_date = ?, check_out_time = ?, duration_minutes = ?
        WHERE id = ?
      `).run(currentDate, currentTime, durationMinutes, activeVisit.id);

      visit = db.prepare(`
        SELECT 
          v.*,
          c.full_name as client_name,
          c.phone as client_phone,
          t.full_name as trainer_name
        FROM visits v
        JOIN clients c ON v.client_id = c.id
        LEFT JOIN trainers t ON c.trainer_id = t.id
        WHERE v.id = ?
      `).get(activeVisit.id);

      action = 'checkout';
      
      res.status(200).json({
        message: `До свидания, ${client.full_name}! Вы были в клубе ${durationMinutes} минут`,
        action,
        visit,
        client: {
          id: client.id,
          full_name: client.full_name,
          phone: client.phone,
          trainer_name: client.trainer_name,
        }
      });
    } else {
      // Это вход - создаём новую запись
      const result = db.prepare(`
        INSERT INTO visits (client_id, check_in_date, check_in_time)
        VALUES (?, ?, ?)
      `).run(client.id, currentDate, currentTime);

      visit = db.prepare(`
        SELECT 
          v.*,
          c.full_name as client_name,
          c.phone as client_phone,
          t.full_name as trainer_name
        FROM visits v
        JOIN clients c ON v.client_id = c.id
        LEFT JOIN trainers t ON c.trainer_id = t.id
        WHERE v.id = ?
      `).get(result.lastInsertRowid);

      action = 'checkin';

      res.status(201).json({
        message: `Добро пожаловать, ${client.full_name}!`,
        action,
        visit,
        client: {
          id: client.id,
          full_name: client.full_name,
          phone: client.phone,
          membership_active: client.membership_active,
          membership_end_date: client.membership_end_date,
          trainer_name: client.trainer_name,
        }
      });
    }
  } catch (error) {
    console.error('Check-in/out error:', error);
    res.status(500).json({ error: 'Ошибка регистрации входа/выхода' });
  }
});

// Получить историю посещений клиента
router.get('/client/:clientId', authenticateToken, (req, res) => {
  try {
    const visits = db.prepare(`
      SELECT 
        v.*,
        c.full_name as client_name,
        t.full_name as trainer_name
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN trainers t ON c.trainer_id = t.id
      WHERE v.client_id = ?
      ORDER BY v.check_in_date DESC, v.check_in_time DESC
    `).all(req.params.clientId);

    res.json(visits);
  } catch (error) {
    console.error('Get client visits error:', error);
    res.status(500).json({ error: 'Ошибка получения истории посещений' });
  }
});

// Удалить посещение
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM visits WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Посещение не найдено' });
    }

    res.json({ message: 'Посещение успешно удалено' });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ error: 'Ошибка удаления посещения' });
  }
});

export default router;
