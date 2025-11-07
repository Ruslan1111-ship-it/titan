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
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Типы абонементов
  CREATE TABLE IF NOT EXISTS membership_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sessions_count INTEGER NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Купленные абонементы клиентов
  CREATE TABLE IF NOT EXISTS client_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    membership_type_id INTEGER NOT NULL,
    purchase_date DATE NOT NULL,
    total_sessions INTEGER NOT NULL,
    remaining_sessions INTEGER NOT NULL,
    price_paid REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_type_id) REFERENCES membership_types(id)
  );

  -- Расписание тренировок
  CREATE TABLE IF NOT EXISTS training_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    membership_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled',
    completed_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES client_memberships(id) ON DELETE CASCADE
  );

  -- История тренировок (для статистики)
  CREATE TABLE IF NOT EXISTS training_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    membership_id INTEGER NOT NULL,
    training_date DATE NOT NULL,
    training_time TIME NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES client_memberships(id)
  );

  -- Индексы для оптимизации запросов
  CREATE INDEX IF NOT EXISTS idx_clients_uuid ON clients(uuid);
  CREATE INDEX IF NOT EXISTS idx_client_memberships_client ON client_memberships(client_id);
  CREATE INDEX IF NOT EXISTS idx_training_schedule_date ON training_schedule(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_training_schedule_client ON training_schedule(client_id);
  CREATE INDEX IF NOT EXISTS idx_training_history_date ON training_history(training_date);
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
  console.log('✓ Администратор по умолчанию создан');
  console.log('  Логин: titan_admin');
  console.log('  Пароль: Titan2025!');
}

// Создание типов абонементов по умолчанию
const membershipTypes = [
  { name: 'Разовое занятие', sessions: 1, price: 1500, description: 'Одна персональная тренировка' },
  { name: 'Абонемент 5 тренировок', sessions: 5, price: 7000, description: '5 персональных тренировок' },
  { name: 'Абонемент 10 тренировок', sessions: 10, price: 13000, description: '10 персональных тренировок' },
];

membershipTypes.forEach(type => {
  const existing = db.prepare('SELECT id FROM membership_types WHERE name = ?').get(type.name);
  if (!existing) {
    db.prepare('INSERT INTO membership_types (name, sessions_count, price, description) VALUES (?, ?, ?, ?)').run(
      type.name,
      type.sessions,
      type.price,
      type.description
    );
    console.log(`✓ Создан тип абонемента: ${type.name}`);
  }
});

console.log('✓ База данных инициализирована');
console.log('');
console.log('Структура базы данных:');
console.log('- admins: администраторы системы');
console.log('- trainers: тренеры');
console.log('- clients: клиенты с QR-кодами');
console.log('- visits: журнал посещений');

process.exit(0);
