import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';

const Memberships = () => {
  const [types, setTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sessions_count: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memberships/types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingType 
        ? `/api/memberships/types/${editingType.id}`
        : '/api/memberships/types';
      
      const response = await fetch(url, {
        method: editingType ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchTypes();
        setShowForm(false);
        setEditingType(null);
        setFormData({ name: '', sessions_count: '', price: '', description: '' });
      }
    } catch (error) {
      console.error('Error saving type:', error);
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      sessions_count: type.sessions_count,
      price: type.price,
      description: type.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот тип абонемента?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/memberships/types/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Типы абонементов</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingType(null);
            setFormData({ name: '', sessions_count: '', price: '', description: '' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Добавить тип
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingType ? 'Редактировать тип' : 'Новый тип абонемента'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Количество тренировок</label>
              <input
                type="number"
                value={formData.sessions_count}
                onChange={(e) => setFormData({...formData, sessions_count: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Цена (₽)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Описание</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingType(null);
                }}
                className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map(type => (
          <div key={type.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{type.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Тренировок:</span>
                <span className="font-semibold">{type.sessions_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Цена:</span>
                <span className="font-semibold text-green-600">{type.price} ₽</span>
              </div>
              {type.description && (
                <p className="text-sm text-gray-500 mt-2">{type.description}</p>
              )}
              <div className="text-sm text-gray-500 mt-2">
                Цена за тренировку: {Math.round(type.price / type.sessions_count)} ₽
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Memberships;
