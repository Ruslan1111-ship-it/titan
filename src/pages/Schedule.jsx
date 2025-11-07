import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Check, X, Clock, User } from 'lucide-react';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientMemberships, setClientMemberships] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    membership_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    duration_minutes: 60,
    notes: ''
  });

  useEffect(() => {
    fetchSchedule();
    fetchClients();
  }, [selectedDate]);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule?start_date=${selectedDate}&end_date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientMemberships = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/memberships/client/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const active = data.filter(m => m.is_active && m.remaining_sessions > 0);
      setClientMemberships(active);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const handleClientChange = (clientId) => {
    setFormData({...formData, client_id: clientId, membership_id: ''});
    setSelectedClient(clientId);
    if (clientId) {
      fetchClientMemberships(clientId);
    } else {
      setClientMemberships([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchSchedule();
        setShowForm(false);
        setFormData({
          client_id: '',
          membership_id: '',
          scheduled_date: selectedDate,
          scheduled_time: '10:00',
          duration_minutes: 60,
          notes: ''
        });
        setClientMemberships([]);
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error creating training:', error);
    }
  };

  const handleComplete = async (id) => {
    if (!confirm('Отметить тренировку как выполненную?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/schedule/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      fetchSchedule();
    } catch (error) {
      console.error('Error completing training:', error);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Отменить тренировку?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/schedule/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      fetchSchedule();
    } catch (error) {
      console.error('Error cancelling training:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'cancelled': return 'Отменено';
      default: return 'Запланировано';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Расписание тренировок</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Добавить тренировку
        </button>
      </div>

      {/* Date selector */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Выберите дату</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Add training form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Новая тренировка</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Клиент *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Выберите клиента</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name} - {client.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Абонемент *</label>
                <select
                  value={formData.membership_id}
                  onChange={(e) => setFormData({...formData, membership_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  disabled={!selectedClient}
                >
                  <option value="">Выберите абонемент</option>
                  {clientMemberships.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.type_name} (осталось: {m.remaining_sessions})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Дата *</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Время *</label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Длительность (мин)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Заметки</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Дополнительная информация"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Добавить
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setClientMemberships([]);
                }}
                className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule list */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          Тренировки на {new Date(selectedDate).toLocaleDateString('ru-RU')}
        </h2>
        
        {schedule.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
            Нет запланированных тренировок на эту дату
          </div>
        ) : (
          schedule.map(training => (
            <div key={training.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="text-xl font-bold">{training.client_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(training.status)}`}>
                      {getStatusText(training.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{training.scheduled_time} ({training.duration_minutes} мин)</span>
                    </div>
                    <div className="text-gray-600">
                      Телефон: {training.client_phone}
                    </div>
                    <div className="text-gray-600">
                      Абонемент: {training.type_name}
                    </div>
                    <div className="text-gray-600">
                      Осталось тренировок: {training.remaining_sessions}
                    </div>
                  </div>

                  {training.notes && (
                    <div className="mt-3 text-sm text-gray-500">
                      Заметки: {training.notes}
                    </div>
                  )}
                </div>

                {training.status === 'scheduled' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleComplete(training.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                      Выполнено
                    </button>
                    <button
                      onClick={() => handleCancel(training.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                      Отменить
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Schedule;
