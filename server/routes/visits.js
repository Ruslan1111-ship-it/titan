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
      query += ' AND v.visit_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND v.visit_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY v.visit_date DESC, v.visit_time DESC LIMIT ?';
    params.push(parseInt(limit));

    const visits = db.prepare(query).all(...params);

    res.json(visits);
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Ошибка получения списка посещений' });
  }
});

// Зарегистрировать посещение (сканирование QR-кода)
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

    // Зарегистрировать посещение
    const now = new Date();
    const visitDate = now.toISOString().split('T')[0];
    const visitTime = now.toTimeString().split(' ')[0];

    const result = db.prepare(`
      INSERT INTO visits (client_id, visit_date, visit_time)
      VALUES (?, ?, ?)
    `).run(client.id, visitDate, visitTime);

    const visit = db.prepare(`
      SELECT 
        v.*,
        c.full_name as client_name,
        c.phone as client_phone,
        t.full_name as trainer_name,
        t.phone as trainer_phone,
        t.specialization as trainer_specialization
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN trainers t ON c.trainer_id = t.id
      WHERE v.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Посещение успешно зарегистрировано',
      visit,
      client: {
        id: client.id,
        full_name: client.full_name,
        phone: client.phone,
        membership_active: client.membership_active,
        membership_end_date: client.membership_end_date,
        trainer_name: client.trainer_name,
        trainer_phone: client.trainer_phone,
        trainer_specialization: client.trainer_specialization,
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Ошибка регистрации посещения' });
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
      ORDER BY v.visit_date DESC, v.visit_time DESC
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
