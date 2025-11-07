# Инструкция по установке

## Проблема с установкой

При установке зависимостей возникла ошибка компиляции `better-sqlite3`, так как требуются Xcode Command Line Tools.

## Решение

### Вариант 1: Установить Xcode Command Line Tools (Рекомендуется)

Выполните в терминале:

```bash
xcode-select --install
```

После установки запустите:

```bash
npm install
npm run init-db
npm run dev
```

### Вариант 2: Использовать Docker (Альтернатива)

Если не хотите устанавливать Xcode Command Line Tools, можно использовать Docker.

Создайте файл `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["npm", "run", "dev"]
```

Создайте `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

Запустите:

```bash
docker-compose up
```

### Вариант 3: Использовать готовый бинарный файл

Если у вас macOS на Apple Silicon (M1/M2/M3), можно попробовать:

```bash
npm install better-sqlite3 --build-from-source=false
npm install
```

## После успешной установки

1. Инициализируйте базу данных:
```bash
npm run init-db
```

2. Запустите приложение:
```bash
npm run dev
```

3. Откройте браузер:
- Админ-панель: http://localhost:3000
- Сканер QR: http://localhost:3000/scanner

4. Войдите в систему:
- Логин: `admin`
- Пароль: `admin123`

## Структура проекта

```
windsurf-project/
├── server/           # Backend (Express + SQLite)
├── src/             # Frontend (React + TailwindCSS)
├── package.json     # Зависимости
├── .env            # Конфигурация (создан автоматически)
└── README.md       # Документация
```

## Возможности

✅ Управление клиентами и тренерами
✅ Генерация QR-кодов
✅ Сканирование QR-кодов через камеру
✅ Журнал посещений
✅ Аналитика и отчёты
✅ Безопасная аутентификация

## Поддержка

Если возникли проблемы:

1. Убедитесь, что установлены Xcode Command Line Tools
2. Проверьте версию Node.js (требуется 16+)
3. Очистите кэш: `npm cache clean --force`
4. Удалите node_modules и переустановите: `rm -rf node_modules && npm install`
