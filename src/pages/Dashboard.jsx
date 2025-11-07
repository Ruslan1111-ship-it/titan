import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Calendar, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeMemberships: 0,
    scheduledSessions: 0,
    monthEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Получаем клиентов
      const clientsResponse = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clients = await clientsResponse.json();
      
      // Получаем активные абонементы
      const membershipsResponse = await fetch('/api/memberships/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const memberships = await membershipsResponse.json();
      
      // Получаем расписание на текущий месяц
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const scheduleResponse = await fetch(`/api/schedule?start_date=${startOfMonth}&end_date=${endOfMonth}&status=scheduled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const schedule = await scheduleResponse.json();
      
      // Получаем заработок за месяц
      const earningsResponse = await fetch('/api/analytics/earnings?period=month', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const earnings = await earningsResponse.json();
      
      setStats({
        totalClients: clients.length,
        activeMemberships: memberships.length,
        scheduledSessions: schedule.length,
        monthEarnings: earnings.totalEarnings || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Всего клиентов',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Активных абонементов',
      value: stats.activeMemberships,
      icon: CreditCard,
      color: 'bg-green-500',
    },
    {
      name: 'Запланировано тренировок',
      value: stats.scheduledSessions,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      name: 'Заработок за месяц',
      value: `${stats.monthEarnings.toLocaleString('ru-RU')} ₽`,
      icon: DollarSign,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Trainer Photo */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Trainer Photo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
              <img 
                src="/images/trainer.jpg" 
                alt="Абдрахманов Булат"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://ui-avatars.com/api/?name=Bulat+Abdrakhmanov&size=128&background=3b82f6&color=fff&bold=true";
                }}
              />
            </div>
          </div>
          
          {/* Trainer Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Абдрахманов Булат</h1>
            <p className="text-lg text-white/90 mb-4">Персональный тренер</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 truncate">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl ml-4 flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Общая информация</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Всего клиентов:</span>
              <span className="font-semibold">{stats.totalClients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Активных абонементов:</span>
              <span className="font-semibold">{stats.activeMemberships}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Тренировок в этом месяце:</span>
              <span className="font-semibold">{stats.scheduledSessions}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
          <h3 className="text-lg font-bold mb-4">Быстрые действия</h3>
          <div className="space-y-3">
            <a
              href="/clients"
              className="block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Управление клиентами
            </a>
            <a
              href="/schedule"
              className="block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Расписание тренировок
            </a>
            <a
              href="/analytics"
              className="block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Аналитика и заработок
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
