import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'gym.db');

let SQL;
let db;

// Initialize database
async function initDatabase() {
  SQL = await initSqlJs();
  
  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  return db;
}

// Wrapper for prepare-like functionality
class Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
  }

  run(...params) {
    this.db.run(this.sql, params);
    saveDatabase();
    return { 
      lastInsertRowid: this.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0],
      changes: this.db.getRowsModified()
    };
  }

  get(...params) {
    const result = this.db.exec(this.sql, params);
    if (result.length === 0) return undefined;
    
    const columns = result[0].columns;
    const values = result[0].values[0];
    
    if (!values) return undefined;
    
    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    return row;
  }

  all(...params) {
    const result = this.db.exec(this.sql, params);
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

// Database wrapper
const dbWrapper = {
  prepare(sql) {
    return new Statement(db, sql);
  },
  
  exec(sql) {
    db.run(sql);
    saveDatabase();
  },
  
  pragma(pragma) {
    db.run(`PRAGMA ${pragma}`);
  }
};

function saveDatabase() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
  }
}

// Initialize on import
await initDatabase();

export default dbWrapper;
