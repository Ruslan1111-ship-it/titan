import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CreditCard, Calendar, QrCode, LogOut, Menu, X, Settings } from 'lucide-react';

const Layout = ({ children, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Клиенты', href: '/clients', icon: Users },
    { name: 'Абонементы', href: '/memberships', icon: CreditCard },
    { name: 'Расписание', href: '/schedule', icon: Calendar },
    { name: 'Настройки', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-blue-600 shadow-lg z-50 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-white">Персональный Тренер</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo - hidden on mobile (shown in header) */}
          <div className="hidden lg:flex flex-col items-center justify-center h-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <h1 className="text-xl font-bold text-white">Персональный</h1>
            <h1 className="text-xl font-bold text-white">Тренер</h1>
          </div>

          {/* Spacer for mobile header */}
          <div className="h-16 lg:hidden"></div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
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

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
