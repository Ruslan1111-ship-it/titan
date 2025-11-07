import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, QrCode, CreditCard, Download } from 'lucide-react';

const ClientsNew = () => {
  const [clients, setClients] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [qrData, setQrData] = useState(null);
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
    fetchClients();
    fetchMembershipTypes();
  }, []);

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
        fetchClients();
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

  const handleShowQR = async (client) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clients/${client.uuid}/qrcode`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setQrData({ ...data, client });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить клиента?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchClients();
    } catch (error) {
      console.error('Error:', error);
    }
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

      {/* QR Code Modal */}
      {qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4">{qrData.client.full_name}</h2>
            <img src={qrData.qrCode} alt="QR Code" className="mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">UUID: {qrData.client.uuid}</p>
            <div className="flex gap-2">
              <a
                href={qrData.qrCode}
                download={`${qrData.client.full_name}-QR.png`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                <Download className="w-4 h-4" />
                Скачать
              </a>
              <button
                onClick={() => setQrData(null)}
                className="flex-1 px-4 py-2 bg-gray-300 rounded-lg"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата регистрации</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map(client => (
              <tr key={client.id}>
                <td className="px-6 py-4">{client.full_name}</td>
                <td className="px-6 py-4">{client.phone}</td>
                <td className="px-6 py-4">{new Date(client.registration_date).toLocaleDateString('ru-RU')}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowMembershipForm(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Купить абонемент"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShowQR(client)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="QR-код"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsNew;
