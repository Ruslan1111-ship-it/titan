import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, UserCheck, Activity, BarChart3, QrCode, LogOut } from 'lucide-react';

const Layout = ({ children, onLogout }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Клиенты', href: '/clients', icon: Users },
    { name: 'Тренеры', href: '/trainers', icon: UserCheck },
    { name: 'Посещения', href: '/visits', icon: Activity },
    { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">ТИТАН</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Scanner & Logout */}
          <div className="p-4 border-t">
            <a
              href="/scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 mb-2 text-sm font-medium text-green-600 transition-colors rounded-lg hover:bg-green-50"
            >
              <QrCode className="w-5 h-5 mr-3" />
              Сканер QR
            </a>
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 transition-colors rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Выход
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
