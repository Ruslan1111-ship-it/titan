import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить все типы абонементов
router.get('/types', authenticateToken, (req, res) => {
  try {
    const types = db.prepare(`
      SELECT * FROM membership_types 
      WHERE is_active = 1
      ORDER BY sessions_count ASC
    `).all();

    res.json(types);
  } catch (error) {
    console.error('Get membership types error:', error);
    res.status(500).json({ error: 'Ошибка получения типов абонементов' });
  }
});

// Создать новый тип абонемента
router.post('/types', authenticateToken, (req, res) => {
  try {
    const { name, sessions_count, price, description } = req.body;

    if (!name || !sessions_count || !price) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const result = db.prepare(`
      INSERT INTO membership_types (name, sessions_count, price, description)
      VALUES (?, ?, ?, ?)
    `).run(name, sessions_count, price, description || null);

    const newType = db.prepare('SELECT * FROM membership_types WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newType);
  } catch (error) {
    console.error('Create membership type error:', error);
    res.status(500).json({ error: 'Ошибка создания типа абонемента' });
  }
});

// Обновить тип абонемента
router.put('/types/:id', authenticateToken, (req, res) => {
  try {
    const { name, sessions_count, price, description } = req.body;

    db.prepare(`
      UPDATE membership_types 
      SET name = ?, sessions_count = ?, price = ?, description = ?
      WHERE id = ?
    `).run(name, sessions_count, price, description || null, req.params.id);

    const updated = db.prepare('SELECT * FROM membership_types WHERE id = ?').get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error('Update membership type error:', error);
    res.status(500).json({ error: 'Ошибка обновления типа абонемента' });
  }
});

// Удалить тип абонемента (мягкое удаление)
router.delete('/types/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE membership_types SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Тип абонемента удалён' });
  } catch (error) {
    console.error('Delete membership type error:', error);
    res.status(500).json({ error: 'Ошибка удаления типа абонемента' });
  }
});

// Получить все абонементы клиента
router.get('/client/:clientId', authenticateToken, (req, res) => {
  try {
    const memberships = db.prepare(`
      SELECT 
        cm.*,
        mt.name as type_name,
        mt.sessions_count as type_sessions,
        c.full_name as client_name
      FROM client_memberships cm
      JOIN membership_types mt ON cm.membership_type_id = mt.id
      JOIN clients c ON cm.client_id = c.id
      WHERE cm.client_id = ?
      ORDER BY cm.purchase_date DESC
    `).all(req.params.clientId);

    res.json(memberships);
  } catch (error) {
    console.error('Get client memberships error:', error);
    res.status(500).json({ error: 'Ошибка получения абонементов клиента' });
  }
});

// Купить абонемент для клиента
router.post('/purchase', authenticateToken, (req, res) => {
  try {
    const { client_id, membership_type_id, price_paid, notes } = req.body;

    if (!client_id || !membership_type_id || !price_paid) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // Получаем тип абонемента
    const membershipType = db.prepare('SELECT * FROM membership_types WHERE id = ?').get(membership_type_id);
    
    if (!membershipType) {
      return res.status(404).json({ error: 'Тип абонемента не найден' });
    }

    const purchaseDate = new Date().toISOString().split('T')[0];

    const result = db.prepare(`
      INSERT INTO client_memberships 
      (client_id, membership_type_id, purchase_date, total_sessions, remaining_sessions, price_paid, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      client_id,
      membership_type_id,
      purchaseDate,
      membershipType.sessions_count,
      membershipType.sessions_count,
      price_paid,
      notes || null
    );

    const newMembership = db.prepare(`
      SELECT 
        cm.*,
        mt.name as type_name,
        c.full_name as client_name
      FROM client_memberships cm
      JOIN membership_types mt ON cm.membership_type_id = mt.id
      JOIN clients c ON cm.client_id = c.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newMembership);
  } catch (error) {
    console.error('Purchase membership error:', error);
    res.status(500).json({ error: 'Ошибка покупки абонемента' });
  }
});

// Получить активные абонементы
router.get('/active', authenticateToken, (req, res) => {
  try {
    const activeMemberships = db.prepare(`
      SELECT 
        cm.*,
        mt.name as type_name,
        c.full_name as client_name,
        c.phone as client_phone
      FROM client_memberships cm
      JOIN membership_types mt ON cm.membership_type_id = mt.id
      JOIN clients c ON cm.client_id = c.id
      WHERE cm.is_active = 1 AND cm.remaining_sessions > 0
      ORDER BY cm.purchase_date DESC
    `).all();

    res.json(activeMemberships);
  } catch (error) {
    console.error('Get active memberships error:', error);
    res.status(500).json({ error: 'Ошибка получения активных абонементов' });
  }
});

// Деактивировать абонемент
router.put('/:id/deactivate', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE client_memberships SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Абонемент деактивирован' });
  } catch (error) {
    console.error('Deactivate membership error:', error);
    res.status(500).json({ error: 'Ошибка деактивации абонемента' });
  }
});

export default router;
