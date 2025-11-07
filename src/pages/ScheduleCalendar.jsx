import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Clock, User, Check, X } from 'lucide-react';

const ScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [monthSchedule, setMonthSchedule] = useState({});
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientMemberships, setClientMemberships] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    membership_id: '',
    scheduled_time: '10:00',
    duration_minutes: 60,
    notes: ''
  });

  useEffect(() => {
    fetchClients();
    fetchMonthSchedule();
  }, [currentDate]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMonthSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const response = await fetch(`/api/schedule?start_date=${startDate}&end_date=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Группируем по датам
      const grouped = {};
      data.forEach(item => {
        if (!grouped[item.scheduled_date]) {
          grouped[item.scheduled_date] = [];
        }
        grouped[item.scheduled_date].push(item);
      });
      
      setMonthSchedule(grouped);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchDaySchedule = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/schedule?start_date=${dateStr}&end_date=${dateStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSchedule(data.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)));
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    fetchDaySchedule(date);
    setShowDayModal(true);
  };

  const handleClientChange = (clientId) => {
    setFormData({...formData, client_id: clientId, membership_id: ''});
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
        body: JSON.stringify({
          ...formData,
          scheduled_date: selectedDate.toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        fetchDaySchedule(selectedDate);
        fetchMonthSchedule();
        setShowAddForm(false);
        setFormData({
          client_id: '',
          membership_id: '',
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
      console.error('Error:', error);
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
      fetchDaySchedule(selectedDate);
      fetchMonthSchedule();
    } catch (error) {
      console.error('Error:', error);
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
      fetchDaySchedule(selectedDate);
      fetchMonthSchedule();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Calendar generation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник = 0
    
    const days = [];
    
    // Пустые ячейки до начала месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getSessionsCount = (date) => {
    if (!date) return 0;
    const dateStr = date.toISOString().split('T')[0];
    return monthSchedule[dateStr]?.length || 0;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

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
        <h1 className="text-3xl font-bold">Расписание</h1>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week days header */}
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((date, index) => {
            const sessionsCount = getSessionsCount(date);
            return (
              <div
                key={index}
                onClick={() => date && handleDateClick(date)}
                className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-colors ${
                  date ? 'hover:bg-blue-50' : 'bg-gray-50'
                } ${isToday(date) ? 'border-blue-500 border-2' : 'border-gray-200'}`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </div>
                    {sessionsCount > 0 && (
                      <div className="mt-1">
                        <div className="text-xs bg-blue-600 text-white rounded-full px-2 py-1 text-center">
                          {sessionsCount} {sessionsCount === 1 ? 'тренировка' : 'тренировок'}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Schedule Modal */}
      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить
                  </button>
                  <button
                    onClick={() => {
                      setShowDayModal(false);
                      setShowAddForm(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Add Form */}
              {showAddForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold mb-4">Новая тренировка</h3>
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
                              {client.full_name}
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
                          disabled={!formData.client_id}
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
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg">
                        Добавить
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setClientMemberships([]);
                        }}
                        className="px-6 py-2 bg-gray-300 rounded-lg"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Schedule Table */}
              {schedule.length > 0 ? (
                <div className="space-y-3">
                  {schedule.map(training => (
                    <div key={training.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <span className="font-bold text-lg">{training.scheduled_time}</span>
                            <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(training.status)}`}>
                              {getStatusText(training.status)}
                            </span>
                          </div>
                          
                          <div className="ml-8 space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-semibold">{training.client_name}</span>
                            </div>
                            <p className="text-sm text-gray-600">Телефон: {training.client_phone}</p>
                            <p className="text-sm text-gray-600">Абонемент: {training.type_name}</p>
                            <p className="text-sm text-gray-600">Длительность: {training.duration_minutes} мин</p>
                            {training.notes && (
                              <p className="text-sm text-gray-500 italic">Заметки: {training.notes}</p>
                            )}
                          </div>
                        </div>

                        {training.status === 'scheduled' && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleComplete(training.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              <Check className="w-4 h-4" />
                              Выполнено
                            </button>
                            <button
                              onClick={() => handleCancel(training.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              <X className="w-4 h-4" />
                              Отменить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Нет запланированных тренировок на этот день
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;
