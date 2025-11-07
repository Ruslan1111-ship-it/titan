import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить всех клиентов
router.get('/', authenticateToken, (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT * FROM clients
      ORDER BY full_name
    `).all();

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Ошибка получения списка клиентов' });
  }
});

// Получить клиента по ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Ошибка получения данных клиента' });
  }
});

// Получить клиента по UUID (для сканирования QR)
router.get('/uuid/:uuid', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE uuid = ?').get(req.params.uuid);

    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client by UUID error:', error);
    res.status(500).json({ error: 'Ошибка получения данных клиента' });
  }
});

// Создать клиента
router.post('/', authenticateToken, (req, res) => {
  try {
    const { full_name, phone, registration_date, notes } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'Укажите ФИО и телефон' });
    }

    const uuid = uuidv4();
    const regDate = registration_date || new Date().toISOString().split('T')[0];
    
    const result = db.prepare(`
      INSERT INTO clients (uuid, full_name, phone, registration_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuid,
      full_name,
      phone,
      regDate,
      notes || null
    );

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Ошибка создания клиента' });
  }
});

// Обновить клиента
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { full_name, phone, notes } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'Укажите ФИО и телефон' });
    }

    db.prepare(`
      UPDATE clients
      SET full_name = ?, phone = ?, notes = ?
      WHERE id = ?
    `).run(
      full_name,
      phone,
      notes || null,
      req.params.id
    );

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Ошибка обновления клиента' });
  }
});

// Удалить клиента
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    res.json({ message: 'Клиент успешно удалён' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Ошибка удаления клиента' });
  }
});

export default router;
