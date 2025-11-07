import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Общая статистика
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    const today = new Date();
    
    if (period === 'day') {
      const todayStr = today.toISOString().split('T')[0];
      dateFilter = `AND v.visit_date = '${todayStr}'`;
    } else if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = `AND v.visit_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND v.visit_date >= '${monthAgo.toISOString().split('T')[0]}'`;
    }

    // Общее количество посещений
    const totalVisits = db.prepare(`
      SELECT COUNT(*) as count
      FROM visits v
      WHERE 1=1 ${dateFilter}
    `).get();

    // Уникальные посетители
    const uniqueVisitors = db.prepare(`
      SELECT COUNT(DISTINCT client_id) as count
      FROM visits v
      WHERE 1=1 ${dateFilter}
    `).get();

    // Активные абонементы
    const activeMembers = db.prepare(`
      SELECT COUNT(*) as count
      FROM clients
      WHERE membership_active = 1
      AND (membership_end_date IS NULL OR membership_end_date >= date('now'))
    `).get();

    // Всего клиентов
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get();

    // Всего тренеров
    const totalTrainers = db.prepare('SELECT COUNT(*) as count FROM trainers').get();

    // Процент посещаемости
    const attendanceRate = activeMembers.count > 0 
      ? ((uniqueVisitors.count / activeMembers.count) * 100).toFixed(1)
      : 0;

    res.json({
      totalVisits: totalVisits.count,
      uniqueVisitors: uniqueVisitors.count,
      activeMembers: activeMembers.count,
      totalClients: totalClients.count,
      totalTrainers: totalTrainers.count,
      attendanceRate: parseFloat(attendanceRate),
      period,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Топ активных клиентов
router.get('/top-clients', authenticateToken, (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query;
    
    let dateFilter = '';
    const today = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = `AND v.visit_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND v.visit_date >= '${monthAgo.toISOString().split('T')[0]}'`;
    }

    const topClients = db.prepare(`
      SELECT 
        c.id,
        c.full_name,
        c.phone,
        t.full_name as trainer_name,
        COUNT(v.id) as visit_count,
        MAX(v.visit_date) as last_visit
      FROM clients c
      JOIN visits v ON c.id = v.client_id
      LEFT JOIN trainers t ON c.trainer_id = t.id
      WHERE 1=1 ${dateFilter}
      GROUP BY c.id
      ORDER BY visit_count DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json(topClients);
  } catch (error) {
    console.error('Get top clients error:', error);
    res.status(500).json({ error: 'Ошибка получения топа клиентов' });
  }
});

// Статистика по тренерам
router.get('/trainer-stats', authenticateToken, (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    const today = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = `AND v.visit_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND v.visit_date >= '${monthAgo.toISOString().split('T')[0]}'`;
    }

    const trainerStats = db.prepare(`
      SELECT 
        t.id,
        t.full_name,
        t.specialization,
        COUNT(DISTINCT c.id) as total_clients,
        COUNT(DISTINCT CASE WHEN c.membership_active = 1 THEN c.id END) as active_clients,
        COALESCE(SUM(visit_count), 0) as total_visits
      FROM trainers t
      LEFT JOIN clients c ON t.id = c.trainer_id
      LEFT JOIN (
        SELECT client_id, COUNT(*) as visit_count
        FROM visits v
        WHERE 1=1 ${dateFilter}
        GROUP BY client_id
      ) v ON c.id = v.client_id
      GROUP BY t.id
      ORDER BY total_visits DESC
    `).all();

    res.json(trainerStats);
  } catch (error) {
    console.error('Get trainer stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики тренеров' });
  }
});

// График посещений по дням
router.get('/visits-chart', authenticateToken, (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const visitsChart = db.prepare(`
      SELECT 
        visit_date as date,
        COUNT(*) as count
      FROM visits
      WHERE visit_date >= date('now', '-${parseInt(days)} days')
      GROUP BY visit_date
      ORDER BY visit_date ASC
    `).all();

    res.json(visitsChart);
  } catch (error) {
    console.error('Get visits chart error:', error);
    res.status(500).json({ error: 'Ошибка получения графика посещений' });
  }
});

// Статистика по часам посещений
router.get('/peak-hours', authenticateToken, (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    const today = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = `AND visit_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND visit_date >= '${monthAgo.toISOString().split('T')[0]}'`;
    }

    const peakHours = db.prepare(`
      SELECT 
        CAST(substr(visit_time, 1, 2) AS INTEGER) as hour,
        COUNT(*) as count
      FROM visits
      WHERE 1=1 ${dateFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `).all();

    res.json(peakHours);
  } catch (error) {
    console.error('Get peak hours error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики по часам' });
  }
});

export default router;
