import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, AlertCircle, CheckCircle, DollarSign, Calendar } from 'lucide-react';

const ClientsImproved = () => {
  const [clients, setClients] = useState([]);
  const [clientsWithMemberships, setClientsWithMemberships] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientFormData, setClientFormData] = useState({
    full_name: '',
    phone: '',
    notes: ''
  });
  const [membershipFormData, setMembershipFormData] = useState({
    membership_type_id: '',
    price_paid: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchClients(),
      fetchMembershipTypes()
    ]);
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clientsData = await response.json();
      
      // Для каждого клиента получаем его абонементы
      const clientsWithDetails = await Promise.all(
        clientsData.map(async (client) => {
          const membershipsResponse = await fetch(`/api/memberships/client/${client.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const memberships = await membershipsResponse.json();
          
          // Активные абонементы
          const activeMemberships = memberships.filter(m => m.is_active && m.remaining_sessions > 0);
          
          // Подсчёт задолженности (запланированные тренировки без активных абонементов)
          const scheduleResponse = await fetch(`/api/schedule?client_id=${client.id}&status=scheduled`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const scheduledSessions = await scheduleResponse.json();
          
          const totalRemainingSessions = activeMemberships.reduce((sum, m) => sum + m.remaining_sessions, 0);
          const debt = scheduledSessions.length > totalRemainingSessions ? scheduledSessions.length - totalRemainingSessions : 0;
          
          return {
            ...client,
            activeMemberships,
            allMemberships: memberships,
            totalRemainingSessions,
            scheduledSessions: scheduledSessions.length,
            hasDebt: debt > 0,
            debtAmount: debt
          };
        })
      );
      
      setClientsWithMemberships(clientsWithDetails);
      setClients(clientsData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMembershipTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memberships/types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMembershipTypes(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientFormData)
      });

      if (response.ok) {
        fetchData();
        setShowClientForm(false);
        setClientFormData({ full_name: '', phone: '', notes: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMembershipSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memberships/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: selectedClient.id,
          ...membershipFormData
        })
      });

      if (response.ok) {
        alert('Абонемент успешно куплен!');
        fetchData();
        setShowMembershipForm(false);
        setSelectedClient(null);
        setMembershipFormData({ membership_type_id: '', price_paid: '', notes: '' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTypeChange = (typeId) => {
    const type = membershipTypes.find(t => t.id === parseInt(typeId));
    setMembershipFormData({
      ...membershipFormData,
      membership_type_id: typeId,
      price_paid: type ? type.price : ''
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Клиенты</h1>
        <button
          onClick={() => setShowClientForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Добавить клиента
        </button>
      </div>

      {/* Client Form */}
      {showClientForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Новый клиент</h2>
          <form onSubmit={handleClientSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ФИО *</label>
                <input
                  type="text"
                  value={clientFormData.full_name}
                  onChange={(e) => setClientFormData({...clientFormData, full_name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Телефон *</label>
                <input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Заметки</label>
                <textarea
                  value={clientFormData.notes}
                  onChange={(e) => setClientFormData({...clientFormData, notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg">
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setShowClientForm(false)}
                className="px-6 py-2 bg-gray-300 rounded-lg"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Membership Purchase Form */}
      {showMembershipForm && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Купить абонемент для {selectedClient.full_name}
            </h2>
            <form onSubmit={handleMembershipSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Тип абонемента *</label>
                <select
                  value={membershipFormData.membership_type_id}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Выберите тип</option>
                  {membershipTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.price} ₽ ({type.sessions_count} тренировок)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Оплачено (₽) *</label>
                <input
                  type="number"
                  value={membershipFormData.price_paid}
                  onChange={(e) => setMembershipFormData({...membershipFormData, price_paid: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Заметки</label>
                <input
                  type="text"
                  value={membershipFormData.notes}
                  onChange={(e) => setMembershipFormData({...membershipFormData, notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg">
                  Купить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMembershipForm(false);
                    setSelectedClient(null);
                  }}
                  className="flex-1 px-6 py-2 bg-gray-300 rounded-lg"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="space-y-4">
        {clientsWithMemberships.map(client => (
          <div key={client.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{client.full_name}</h3>
                <p className="text-gray-600">{client.phone}</p>
                {client.notes && (
                  <p className="text-sm text-gray-500 mt-1">{client.notes}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedClient(client);
                  setShowMembershipForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CreditCard className="w-4 h-4" />
                Купить абонемент
              </button>
            </div>

            {/* Active Memberships */}
            {client.activeMemberships.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Активные абонементы:</h4>
                {client.activeMemberships.map(membership => (
                  <div key={membership.id} className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-blue-900">{membership.type_name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Куплено: {new Date(membership.purchase_date).toLocaleDateString('ru-RU')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Оплачено: <span className="font-semibold text-green-600">{membership.price_paid} ₽</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Цена за тренировку: <span className="font-semibold">{Math.round(membership.price_paid / membership.total_sessions)} ₽</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{membership.remaining_sessions}</p>
                        <p className="text-xs text-gray-500">из {membership.total_sessions} тренировок</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Нет активных абонементов</p>
              </div>
            )}

            {/* Status Bar */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Осталось тренировок</p>
                <p className="text-2xl font-bold text-gray-900">{client.totalRemainingSessions}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Запланировано</p>
                <p className="text-2xl font-bold text-blue-600">{client.scheduledSessions}</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${client.hasDebt ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-sm text-gray-600">Статус</p>
                {client.hasDebt ? (
                  <div>
                    <AlertCircle className="w-6 h-6 mx-auto text-red-600" />
                    <p className="text-sm font-semibold text-red-600 mt-1">
                      Нужно {client.debtAmount} тренировок
                    </p>
                  </div>
                ) : (
                  <div>
                    <CheckCircle className="w-6 h-6 mx-auto text-green-600" />
                    <p className="text-sm font-semibold text-green-600 mt-1">Всё оплачено</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {clientsWithMemberships.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
            Нет клиентов. Добавьте первого клиента!
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsImproved;
