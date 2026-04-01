//http://localhost:3000/admin/login.html
// server/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "database.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Admin users
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Categories + translations (EN/TR)
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS category_translations (
      category_id INTEGER NOT NULL,
      language TEXT NOT NULL CHECK(language IN ('en','tr')),
      name TEXT NOT NULL,
      PRIMARY KEY (category_id, language),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Subcategories + translations (EN/TR)
  db.run(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      UNIQUE(category_id, slug),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subcategory_translations (
      subcategory_id INTEGER NOT NULL,
      language TEXT NOT NULL CHECK(language IN ('en','tr')),
      name TEXT NOT NULL,
      PRIMARY KEY (subcategory_id, language),
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
    )
  `);

  // Products (language-neutral)
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      category_id INTEGER NOT NULL,
      subcategory_id INTEGER,

      price INTEGER,
      currency TEXT DEFAULT 'TRY',

      materials_json TEXT,
      stone TEXT,
      images_json TEXT,

      status TEXT DEFAULT 'available',
      created_at TEXT NOT NULL,
      is_best_seller INTEGER DEFAULT 0,

      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
    )
  `);

  // Product translations (EN/TR)
  db.run(`
    CREATE TABLE IF NOT EXISTS product_translations (
      product_id INTEGER NOT NULL,
      language TEXT NOT NULL CHECK(language IN ('en','tr')),
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      PRIMARY KEY (product_id, language),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
});

module.exports = db;