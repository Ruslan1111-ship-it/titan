import db from './database.js';
import bcrypt from 'bcryptjs';

console.log('Инициализация базы данных...');

// Создание таблиц
db.exec(`
  -- Таблица администраторов
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица тренеров
  CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialization TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица клиентов
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    registration_date DATE NOT NULL,
    membership_active INTEGER DEFAULT 1,
    membership_end_date DATE,
    trainer_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
  );

  -- Таблица посещений
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  -- Индексы для оптимизации запросов
  CREATE INDEX IF NOT EXISTS idx_clients_uuid ON clients(uuid);
  CREATE INDEX IF NOT EXISTS idx_visits_client_id ON visits(client_id);
  CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
  CREATE INDEX IF NOT EXISTS idx_clients_trainer ON clients(trainer_id);
`);

// Создание администратора по умолчанию
const defaultPassword = bcrypt.hashSync('Titan2025!', 10);
const checkAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('titan_admin');

if (!checkAdmin) {
  db.prepare('INSERT INTO admins (username, password, full_name) VALUES (?, ?, ?)').run(
    'titan_admin',
    defaultPassword,
    'Администратор ТИТАН'
  );
  console.log('✓ Создан администратор по умолчанию (логин: titan_admin, пароль: Titan2025!)');
}

console.log('✓ База данных успешно инициализирована!');
console.log('');
console.log('Структура базы данных:');
console.log('- admins: администраторы системы');
console.log('- trainers: тренеры');
console.log('- clients: клиенты с QR-кодами');
console.log('- visits: журнал посещений');

process.exit(0);
