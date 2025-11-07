import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Вход в систему
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

    if (!admin) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const validPassword = bcrypt.compareSync(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Изменение учётных данных
router.post('/change-credentials', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    const adminId = req.user.id;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Требуется текущий пароль' });
    }

    // Проверяем текущий пароль
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId);
    
    if (!admin) {
      return res.status(404).json({ error: 'Администратор не найден' });
    }

    const validPassword = bcrypt.compareSync(currentPassword, admin.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    // Проверяем, что хотя бы одно поле для изменения указано
    if (!newUsername && !newPassword) {
      return res.status(400).json({ error: 'Укажите новый логин или пароль' });
    }

    // Проверяем уникальность нового логина
    if (newUsername && newUsername !== admin.username) {
      const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(newUsername);
      if (existingAdmin) {
        return res.status(400).json({ error: 'Этот логин уже занят' });
      }
    }

    // Обновляем данные
    const updates = [];
    const params = [];

    if (newUsername) {
      updates.push('username = ?');
      params.push(newUsername);
    }

    if (newPassword) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    params.push(adminId);

    const sql = `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    res.json({ 
      message: 'Данные успешно обновлены',
      newUsername: newUsername || admin.username
    });
  } catch (error) {
    console.error('Change credentials error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
