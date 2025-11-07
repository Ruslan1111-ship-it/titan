import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Activity, TrendingUp } from 'lucide-react';
import { getStats, getVisitsChart } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, chartData] = await Promise.all([
        getStats(period),
        getVisitsChart(period === 'week' ? 7 : 30),
      ]);
      setStats(statsData);
      setChartData(chartData.map(item => ({
        date: format(new Date(item.date), 'dd MMM', { locale: ru }),
        count: item.count,
      })));
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
      name: 'Всего посещений',
      value: stats?.totalVisits || 0,
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      name: 'Уникальных посетителей',
      value: stats?.uniqueVisitors || 0,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      name: 'Активных абонементов',
      value: stats?.activeMembers || 0,
      icon: UserCheck,
      color: 'bg-purple-500',
    },
    {
      name: 'Процент посещаемости',
      value: `${stats?.attendanceRate || 0}%`,
      icon: TrendingUp,
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
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'week'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Неделя
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'month'
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Месяц
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">График посещений</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Общая информация</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Всего клиентов:</span>
              <span className="font-semibold">{stats?.totalClients || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Всего тренеров:</span>
              <span className="font-semibold">{stats?.totalTrainers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Период:</span>
              <span className="font-semibold">
                {period === 'week' ? 'Последние 7 дней' : 'Последние 30 дней'}
              </span>
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
              href="/scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Открыть сканер QR
            </a>
            <a
              href="/analytics"
              className="block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Подробная аналитика
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
