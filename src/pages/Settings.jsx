import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle } from 'lucide-react';

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Пароль должен быть минимум 6 символов' });
      return;
    }

    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Введите текущий пароль для подтверждения' });
      return;
    }

    if (!newUsername && !newPassword) {
      setMessage({ type: 'error', text: 'Заполните хотя бы одно поле для изменения' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при изменении данных');
      }

      setMessage({ type: 'success', text: 'Данные успешно изменены!' });
      
      // Clear form
      setCurrentPassword('');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');

      // If username changed, show new username
      if (newUsername) {
        setTimeout(() => {
          setMessage({ 
            type: 'success', 
            text: `Новый логин: ${newUsername}. Используйте его при следующем входе.` 
          });
        }, 2000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Настройки</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Изменить логин и пароль</h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текущий пароль *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите текущий пароль"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Требуется для подтверждения изменений</p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Новые данные</h3>
            
            {/* New Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый логин
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Оставьте пустым, если не хотите менять"
              />
            </div>

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Оставьте пустым, если не хотите менять"
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">Минимум 6 символов</p>
            </div>

            {/* Confirm Password */}
            {newPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Повторите новый пароль"
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Важная информация:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Для изменения данных требуется текущий пароль</li>
            <li>• Можно изменить только логин, только пароль, или оба сразу</li>
            <li>• После изменения логина используйте его при следующем входе</li>
            <li>• Новый пароль должен содержать минимум 6 символов</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
