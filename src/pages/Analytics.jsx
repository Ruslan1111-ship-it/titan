import React, { useState, useEffect } from 'react';
import { getStats, getTopClients, getTrainerStats, getPeakHours } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Activity, TrendingUp, Award } from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [topClients, setTopClients] = useState([]);
  const [trainerStats, setTrainerStats] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, topClientsData, trainerStatsData, peakHoursData] = await Promise.all([
        getStats(period),
        getTopClients(10, period),
        getTrainerStats(period),
        getPeakHours(period),
      ]);
      setStats(statsData);
      setTopClients(topClientsData);
      setTrainerStats(trainerStatsData);
      setPeakHours(peakHoursData);
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
          <p className="text-gray-600 mt-1">Подробная статистика и отчёты</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Месяц
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего посещений</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalVisits || 0}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Уникальных посетителей</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.uniqueVisitors || 0}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Активных абонементов</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeMembers || 0}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Посещаемость</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.attendanceRate || 0}%</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Пиковые часы посещений</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" label={{ value: 'Час', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Посещений', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trainer Stats */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Статистика тренеров</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {trainerStats.map((trainer, index) => (
              <div key={trainer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {trainer.full_name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">{trainer.full_name}</div>
                    <div className="text-sm text-gray-600">{trainer.specialization || 'Без специализации'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{trainer.total_visits}</div>
                  <div className="text-sm text-gray-600">{trainer.active_clients} клиентов</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Топ активных клиентов</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Место</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ФИО</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Телефон</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Тренер</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Посещений</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Последнее посещение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topClients.map((client, index) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.trainer_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      {client.visit_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(client.last_visit).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
