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
      dateFilter = `AND v.check_in_date = '${todayStr}'`;
    } else if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = `AND v.check_in_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND v.check_in_date >= '${monthAgo.toISOString().split('T')[0]}'`;
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
      dateFilter = `AND v.check_in_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND v.check_in_date >= '${monthAgo.toISOString().split('T')[0]}'`;
    }

    const topClients = db.prepare(`
      SELECT 
        c.id,
        c.full_name,
        c.phone,
        t.full_name as trainer_name,
        COUNT(v.id) as visit_count,
        MAX(v.check_in_date) as last_visit
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
      dateFilter = `AND v.check_in_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND v.check_in_date >= '${monthAgo.toISOString().split('T')[0]}'`;
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
        check_in_date as date,
        COUNT(*) as count
      FROM visits
      WHERE check_in_date >= date('now', '-${parseInt(days)} days')
      GROUP BY check_in_date
      ORDER BY check_in_date ASC
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
      dateFilter = `AND check_in_date >= '${weekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = `AND check_in_date >= '${monthAgo.toISOString().split('T')[0]}'`;
    }

    const peakHours = db.prepare(`
      SELECT 
        CAST(substr(check_in_time, 1, 2) AS INTEGER) as hour,
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

// Загруженность клуба (сколько людей в клубе по времени)
router.get('/occupancy', authenticateToken, (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Получаем все посещения за день с временем входа и выхода
    const visits = db.prepare(`
      SELECT 
        check_in_time,
        check_out_time,
        c.full_name as client_name
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      WHERE v.check_in_date = ?
      ORDER BY check_in_time ASC
    `).all(targetDate);

    // Создаём массив для каждого часа (0-23)
    const hourlyOccupancy = Array(24).fill(0).map((_, hour) => ({
      hour,
      count: 0,
      clients: []
    }));

    // Для каждого посещения увеличиваем счётчик для всех часов, когда клиент был в клубе
    visits.forEach(visit => {
      const checkInHour = parseInt(visit.check_in_time.split(':')[0]);
      const checkInMinute = parseInt(visit.check_in_time.split(':')[1]);
      
      let checkOutHour, checkOutMinute;
      if (visit.check_out_time) {
        checkOutHour = parseInt(visit.check_out_time.split(':')[0]);
        checkOutMinute = parseInt(visit.check_out_time.split(':')[1]);
      } else {
        // Если не вышел, считаем что до конца дня
        checkOutHour = 23;
        checkOutMinute = 59;
      }

      // Увеличиваем счётчик для каждого часа пребывания
      for (let hour = checkInHour; hour <= checkOutHour; hour++) {
        // Проверяем, был ли клиент в этом часу
        if (hour === checkInHour && checkInMinute >= 30) {
          // Вошёл во второй половине часа
          continue;
        }
        if (hour === checkOutHour && checkOutMinute < 30) {
          // Вышел в первой половине часа
          continue;
        }
        
        hourlyOccupancy[hour].count++;
        hourlyOccupancy[hour].clients.push(visit.client_name);
      }
    });

    // Получаем текущее количество людей в клубе (для сегодняшнего дня)
    let currentOccupancy = 0;
    if (targetDate === new Date().toISOString().split('T')[0]) {
      currentOccupancy = db.prepare(`
        SELECT COUNT(*) as count
        FROM visits
        WHERE check_in_date = ? AND check_out_date IS NULL
      `).get(targetDate).count;
    }

    res.json({
      date: targetDate,
      currentOccupancy,
      hourlyOccupancy,
      peakHour: hourlyOccupancy.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyOccupancy[0]),
      totalVisits: visits.length
    });
  } catch (error) {
    console.error('Get occupancy error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики загруженности' });
  }
});

// Кто сейчас в клубе
router.get('/current-visitors', authenticateToken, (req, res) => {
  try {
    const currentVisitors = db.prepare(`
      SELECT 
        v.id as visit_id,
        v.check_in_date,
        v.check_in_time,
        c.id as client_id,
        c.full_name,
        c.phone,
        t.full_name as trainer_name,
        CAST((julianday('now') - julianday(v.check_in_date || ' ' || v.check_in_time)) * 24 * 60 AS INTEGER) as minutes_in_gym
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      LEFT JOIN trainers t ON c.trainer_id = t.id
      WHERE v.check_out_date IS NULL
      ORDER BY v.check_in_time ASC
    `).all();

    res.json({
      count: currentVisitors.length,
      visitors: currentVisitors
    });
  } catch (error) {
    console.error('Get current visitors error:', error);
    res.status(500).json({ error: 'Ошибка получения списка посетителей' });
  }
});

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
