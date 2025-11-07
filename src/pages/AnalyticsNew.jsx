import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsNew = () => {
  const [earnings, setEarnings] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/earnings?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEarnings(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
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

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const periodLabels = {
    day: 'Сегодня',
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Аналитика и Заработок</h1>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold opacity-90">Общий заработок</h3>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold">{earnings?.totalEarnings?.toLocaleString('ru-RU')} ₽</p>
          <p className="text-sm opacity-80 mt-2">За период: {periodLabels[period]}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold opacity-90">Проведено тренировок</h3>
            <Calendar className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold">{earnings?.completedSessions}</p>
          <p className="text-sm opacity-80 mt-2">Выполненных сессий</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold opacity-90">Средняя цена</h3>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold">{earnings?.avgSessionPrice?.toLocaleString('ru-RU')} ₽</p>
          <p className="text-sm opacity-80 mt-2">За одну тренировку</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings by Day Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">График заработка по дням</h2>
          {earnings?.earningsByDay?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earnings.earningsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `${value.toLocaleString('ru-RU')} ₽`}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')}
                />
                <Line type="monotone" dataKey="earned" stroke="#10b981" strokeWidth={2} name="Заработок" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Нет данных за выбранный период
            </div>
          )}
        </div>

        {/* Earnings by Type Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Заработок по типам абонементов</h2>
          {earnings?.earningsByType?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earnings.earningsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="membership_type" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString('ru-RU')} ₽`} />
                <Bar dataKey="earned" fill="#3b82f6" name="Заработано" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Нет данных за выбранный период
            </div>
          )}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings by Type Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Детализация по абонементам</h2>
          {earnings?.earningsByType?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тренировок</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заработано</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {earnings.earningsByType.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.membership_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sessions_count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {item.earned.toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Нет проведённых тренировок за выбранный период
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Топ клиенты по заработку</h2>
          {earnings?.topClients?.length > 0 ? (
            <div className="space-y-3">
              {earnings.topClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{client.full_name}</p>
                      <p className="text-xs text-gray-500">{client.sessions_count} тренировок</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{client.total_paid.toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Нет данных о клиентах за выбранный период
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">💰 Итоги за {periodLabels[period].toLowerCase()}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm opacity-80">Всего заработано</p>
            <p className="text-3xl font-bold">{earnings?.totalEarnings?.toLocaleString('ru-RU')} ₽</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Проведено тренировок</p>
            <p className="text-3xl font-bold">{earnings?.completedSessions}</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Средний чек</p>
            <p className="text-3xl font-bold">{earnings?.avgSessionPrice?.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsNew;
