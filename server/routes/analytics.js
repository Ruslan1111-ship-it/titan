import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Статистика заработка
router.get('/earnings', authenticateToken, (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;
    
    let dateFilter = '';
    const today = new Date();
    
    if (start_date && end_date) {
      dateFilter = `AND th.training_date BETWEEN '${start_date}' AND '${end_date}'`;
    } else if (period === 'day') {
      const todayStr = today.toISOString().split('T')[0];
      dateFilter = `AND th.training_date = '${todayStr}'`;
    } else if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = `AND th.training_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND th.training_date >= '${monthAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'year') {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateFilter = `AND th.training_date >= '${yearAgo.toISOString().split('T')[0]}'`;
    }

    // Общий заработок за период
    const totalEarnings = db.prepare(`
      SELECT 
        COUNT(th.id) as completed_sessions,
        COALESCE(SUM(cm.price_paid / cm.total_sessions), 0) as total_earned
      FROM training_history th
      JOIN client_memberships cm ON th.membership_id = cm.id
      WHERE 1=1 ${dateFilter}
    `).get();

    // Заработок по типам абонементов
    const earningsByType = db.prepare(`
      SELECT 
        mt.name as membership_type,
        COUNT(th.id) as sessions_count,
        COALESCE(SUM(cm.price_paid / cm.total_sessions), 0) as earned,
        mt.price as standard_price
      FROM training_history th
      JOIN client_memberships cm ON th.membership_id = cm.id
      JOIN membership_types mt ON cm.membership_type_id = mt.id
      WHERE 1=1 ${dateFilter}
      GROUP BY mt.id, mt.name, mt.price
      ORDER BY earned DESC
    `).all();

    // Заработок по дням (для графика)
    const earningsByDay = db.prepare(`
      SELECT 
        th.training_date as date,
        COUNT(th.id) as sessions_count,
        COALESCE(SUM(cm.price_paid / cm.total_sessions), 0) as earned
      FROM training_history th
      JOIN client_memberships cm ON th.membership_id = cm.id
      WHERE 1=1 ${dateFilter}
      GROUP BY th.training_date
      ORDER BY th.training_date ASC
    `).all();

    // Топ клиенты по заработку
    const topClients = db.prepare(`
      SELECT 
        c.full_name,
        c.phone,
        COUNT(th.id) as sessions_count,
        COALESCE(SUM(cm.price_paid / cm.total_sessions), 0) as total_paid
      FROM training_history th
      JOIN client_memberships cm ON th.membership_id = cm.id
      JOIN clients c ON th.client_id = c.id
      WHERE 1=1 ${dateFilter}
      GROUP BY c.id, c.full_name, c.phone
      ORDER BY total_paid DESC
      LIMIT 10
    `).all();

    // Средняя стоимость тренировки
    const avgSessionPrice = totalEarnings.completed_sessions > 0
      ? totalEarnings.total_earned / totalEarnings.completed_sessions
      : 0;

    res.json({
      totalEarnings: Math.round(totalEarnings.total_earned),
      completedSessions: totalEarnings.completed_sessions,
      avgSessionPrice: Math.round(avgSessionPrice),
      earningsByType: earningsByType.map(item => ({
        ...item,
        earned: Math.round(item.earned)
      })),
      earningsByDay: earningsByDay.map(item => ({
        ...item,
        earned: Math.round(item.earned)
      })),
      topClients: topClients.map(item => ({
        ...item,
        total_paid: Math.round(item.total_paid)
      }))
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики заработка' });
  }
});

export default router;
