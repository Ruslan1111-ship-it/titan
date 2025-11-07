#!/bin/bash

echo "🏋️ Установка системы учёта посещений тренажёрного зала"
echo "========================================================="
echo ""

# Check if Xcode Command Line Tools are installed
if ! xcode-select -p &> /dev/null; then
    echo "❌ Xcode Command Line Tools не установлены"
    echo ""
    echo "Пожалуйста, установите их командой:"
    echo "  xcode-select --install"
    echo ""
    echo "После установки запустите этот скрипт снова."
    exit 1
fi

echo "✅ Xcode Command Line Tools установлены"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    echo "Установите Node.js с https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Требуется Node.js версии 16 или выше"
    echo "Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) установлен"
echo ""

# Install dependencies
echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Ошибка установки зависимостей"
    echo ""
    echo "Попробуйте:"
    echo "  1. Убедитесь, что Xcode Command Line Tools установлены"
    echo "  2. Очистите кэш: npm cache clean --force"
    echo "  3. Удалите node_modules: rm -rf node_modules"
    echo "  4. Запустите снова: ./install.sh"
    exit 1
fi

echo ""
echo "✅ Зависимости установлены"
echo ""

# Initialize database
echo "🗄️ Инициализация базы данных..."
npm run init-db

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Ошибка инициализации базы данных"
    exit 1
fi

echo ""
echo "========================================================="
echo "✅ Установка завершена успешно!"
echo "========================================================="
echo ""
echo "📋 Учётные данные администратора:"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "🚀 Для запуска приложения выполните:"
echo "   npm run dev"
echo ""
echo "🌐 Приложение будет доступно по адресам:"
echo "   • Админ-панель: http://localhost:3000"
echo "   • Сканер QR: http://localhost:3000/scanner"
echo "   • API: http://localhost:3001/api"
echo ""
echo "📖 Документация: README.md"
echo "========================================================="
