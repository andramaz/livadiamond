require("dotenv").config();

const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const db = require("./db");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

// ---------- session store ----------
const sessionsDir = process.env.SESSIONS_PATH || path.join(__dirname, "..", "sessions");
fs.mkdirSync(sessionsDir, { recursive: true });

app.use(
  session({
    store: new FileStore({ path: sessionsDir, retries: 1, ttl: 7200 }),
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
      secure: isProduction         // HTTPS-only in production
    }
  })
);

// ---------- security headers ----------
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }
  next();
});

// ---------- login rate limiter ----------
const loginAttempts = new Map();
function loginRateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  const record = loginAttempts.get(ip) || { count: 0, resetAt: now + window };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + window;
  }
  record.count += 1;
  loginAttempts.set(ip, record);

  if (record.count > maxAttempts) {
    return res.status(429).json({ error: "too_many_attempts" });
  }
  next();
}

// Serve static files from /public
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// If uploads are stored on a persistent volume (outside /public), serve them too
if (process.env.UPLOADS_PATH) {
  app.use("/uploads", express.static(process.env.UPLOADS_PATH));
}

// Root route — serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ---------- auth helpers ----------
function isAdmin(req) {
  return Boolean(req.session?.admin?.id);
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// ---------- ensure uploads dir ----------
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---------- multer config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext.match(/^\.(png|jpg|jpeg|webp|gif)$/) ? ext : ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype && file.mimetype.startsWith("image/");
    cb(ok ? null : new Error("Only image files allowed"), ok);
  }
});

// ---------- seed admin user ----------
function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  db.get("SELECT id FROM admin_users WHERE email = ?", [email], async (err, row) => {
    if (err) return console.error("DB error:", err);
    if (row) return;

    const hash = await bcrypt.hash(password, 12);
    db.run(
      "INSERT INTO admin_users (email, password_hash, created_at) VALUES (?, ?, ?)",
      [email, hash, new Date().toISOString()],
      (e) => {
        if (e) console.error("Admin seed error:", e);
        else console.log("✅ Admin created:", email);
      }
    );
  });
}

// ---------- seed categories/subcategories + translations ----------
function seedTaxonomy() {
  const categories = [
    { slug: "rings", en: "Rings", tr: "Yüzükler" },
    { slug: "necklaces", en: "Necklaces", tr: "Kolyeler" },
    { slug: "earrings", en: "Earrings", tr: "Küpeler" },
    { slug: "bracelets", en: "Bracelets", tr: "Bileklikler" },
    { slug: "collections", en: "Collections", tr: "Setler" }
  ];

  const commonSubs = [
    { slug: "solitaire", en: "Solitaire", tr: "Tektaş" },
    { slug: "baguette", en: "Baguette", tr: "Baget Taşlı" },
    { slug: "colored", en: "Colored Stones", tr: "Renkli Taşlı" },
    { slug: "fantasy", en: "Fantasy", tr: "Fantezi" }
  ];

  const braceletExtra = [{ slug: "tennis", en: "Tennis", tr: "Su Yolu" }];

  categories.forEach((c) => {
    db.run("INSERT OR IGNORE INTO categories (slug) VALUES (?)", [c.slug]);
  });

  categories.forEach((c) => {
    db.get("SELECT id FROM categories WHERE slug = ?", [c.slug], (err, row) => {
      if (err || !row) return;

      db.run(
        "INSERT OR IGNORE INTO category_translations (category_id, language, name) VALUES (?, 'en', ?)",
        [row.id, c.en]
      );
      db.run(
        "INSERT OR IGNORE INTO category_translations (category_id, language, name) VALUES (?, 'tr', ?)",
        [row.id, c.tr]
      );

      const subs = c.slug === "bracelets" ? [...commonSubs, ...braceletExtra] : commonSubs;

      subs.forEach((s) => {
        db.run(
          "INSERT OR IGNORE INTO subcategories (category_id, slug) VALUES (?, ?)",
          [row.id, s.slug],
          () => {
            db.get(
              "SELECT id FROM subcategories WHERE category_id = ? AND slug = ?",
              [row.id, s.slug],
              (e2, subRow) => {
                if (e2 || !subRow) return;

                db.run(
                  "INSERT OR IGNORE INTO subcategory_translations (subcategory_id, language, name) VALUES (?, 'en', ?)",
                  [subRow.id, s.en]
                );
                db.run(
                  "INSERT OR IGNORE INTO subcategory_translations (subcategory_id, language, name) VALUES (?, 'tr', ?)",
                  [subRow.id, s.tr]
                );
              }
            );
          }
        );
      });
    });
  });
}

// ---------- PAGE ROUTES ----------
app.get("/admin", (req, res) => {
  if (isAdmin(req)) {
    return res.redirect("/admin/dashboard");
  }
  return res.sendFile(path.join(__dirname, "..", "public", "admin", "login.html"));
});

app.get("/admin/dashboard", (req, res) => {
  if (!isAdmin(req)) {
    return res.redirect("/admin");
  }
  return res.sendFile(path.join(__dirname, "..", "public", "admin", "admin.html"));
});

// ---------- AUTH ROUTES ----------
app.post("/api/admin/login", loginRateLimit, (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM admin_users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: "db_error" });
    if (!user) return res.status(401).json({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    req.session.admin = { id: user.id, email: user.email };
    res.json({ ok: true });
  });
});

app.get("/api/admin/me", (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  res.json({ ok: true, admin: req.session.admin });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ---------- UPLOAD (ADMIN) ----------
app.post("/api/admin/upload", requireAdmin, upload.array("images", 10), (req, res) => {
  const files = req.files || [];
  const paths = files.map((f) => `/uploads/${f.filename}`);
  res.json({ ok: true, paths });
});

// ---------- TAXONOMY (ADMIN) ----------
app.get("/api/admin/categories", requireAdmin, (req, res) => {
  db.all(
    `
    SELECT c.id, c.slug,
           ct_en.name AS name_en,
           ct_tr.name AS name_tr
    FROM categories c
    LEFT JOIN category_translations ct_en ON ct_en.category_id = c.id AND ct_en.language='en'
    LEFT JOIN category_translations ct_tr ON ct_tr.category_id = c.id AND ct_tr.language='tr'
    ORDER BY c.id ASC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json(rows);
    }
  );
});

app.get("/api/admin/subcategories", requireAdmin, (req, res) => {
  const categoryId = Number(req.query.category_id);
  if (!categoryId) return res.status(400).json({ error: "category_id_required" });

  db.all(
    `
    SELECT s.id, s.slug,
           st_en.name AS name_en,
           st_tr.name AS name_tr
    FROM subcategories s
    LEFT JOIN subcategory_translations st_en ON st_en.subcategory_id = s.id AND st_en.language='en'
    LEFT JOIN subcategory_translations st_tr ON st_tr.subcategory_id = s.id AND st_tr.language='tr'
    WHERE s.category_id = ?
    ORDER BY s.id ASC
    `,
    [categoryId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json(rows);
    }
  );
});

// ---------- PRODUCTS (PUBLIC) ----------
app.get("/api/products", (req, res) => {
  const lang = req.query.lang === "tr" ? "tr" : "en";

  db.all(
    `
    SELECT p.*,
           pt.name AS name,
           pt.description AS description,
           ct.name AS category,
           st.name AS subcategory
    FROM products p
    JOIN product_translations pt ON pt.product_id = p.id AND pt.language = ?
    JOIN category_translations ct ON ct.category_id = p.category_id AND ct.language = ?
    LEFT JOIN subcategory_translations st ON st.subcategory_id = p.subcategory_id AND st.language = ?
    WHERE p.status != 'hidden'
    ORDER BY datetime(p.created_at) DESC
    `,
    [lang, lang, lang],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });

      const normalized = rows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory || "",
        price: p.price != null ? `₺${Number(p.price).toLocaleString("tr-TR")}` : null,
        materials: JSON.parse(p.materials_json || "[]"),
        stone: p.stone || "None",
        images: JSON.parse(p.images_json || "[]"),
        status: p.status,
        isBestSeller: Boolean(p.is_best_seller),
        createdAt: p.created_at
      }));

      res.json(normalized);
    }
  );
});

// ---------- PRODUCTS (ADMIN) ----------
app.get("/api/admin/products", requireAdmin, (req, res) => {
  db.all(
    `
    SELECT p.*,
           en.name AS name_en, en.description AS description_en,
           tr.name AS name_tr, tr.description AS description_tr
    FROM products p
    LEFT JOIN product_translations en ON en.product_id = p.id AND en.language='en'
    LEFT JOIN product_translations tr ON tr.product_id = p.id AND tr.language='tr'
    ORDER BY datetime(p.created_at) DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });

      const normalized = rows.map((p) => ({
        id: p.id,
        category_id: p.category_id,
        subcategory_id: p.subcategory_id,
        price: p.price,
        currency: p.currency,
        materials: JSON.parse(p.materials_json || "[]"),
        stone: p.stone || "None",
        images: JSON.parse(p.images_json || "[]"),
        status: p.status,
        isBestSeller: Boolean(p.is_best_seller),
        createdAt: p.created_at,
        name_en: p.name_en || "",
        description_en: p.description_en || "",
        name_tr: p.name_tr || "",
        description_tr: p.description_tr || ""
      }));

      res.json(normalized);
    }
  );
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  const {
    category_id,
    subcategory_id,
    price,
    materials,
    stone,
    images,
    status,
    isBestSeller,
    name_en,
    description_en,
    name_tr,
    description_tr
  } = req.body;

  if (!category_id || !name_en || !name_tr || !description_en || !description_tr) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  const createdAt = new Date().toISOString();

  db.run(
    `
    INSERT INTO products
    (category_id, subcategory_id, price, currency, materials_json, stone, images_json, status, created_at, is_best_seller)
    VALUES (?, ?, ?, 'TRY', ?, ?, ?, ?, ?, ?)
    `,
    [
      Number(category_id),
      subcategory_id ? Number(subcategory_id) : null,
      price != null && price !== "" ? Number(price) : null,
      JSON.stringify(materials || []),
      stone || "None",
      JSON.stringify(images || []),
      status || "available",
      createdAt,
      isBestSeller ? 1 : 0
    ],
    function (err) {
      if (err) return res.status(500).json({ error: "db_error" });

      const newId = this.lastID;

      db.run(
        "INSERT INTO product_translations (product_id, language, name, description) VALUES (?, 'en', ?, ?)",
        [newId, name_en, description_en],
        (e1) => {
          if (e1) return res.status(500).json({ error: "db_error_translations_en" });

          db.run(
            "INSERT INTO product_translations (product_id, language, name, description) VALUES (?, 'tr', ?, ?)",
            [newId, name_tr, description_tr],
            (e2) => {
              if (e2) return res.status(500).json({ error: "db_error_translations_tr" });
              res.json({ ok: true, id: newId });
            }
          );
        }
      );
    }
  );
});

app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  const {
    category_id,
    subcategory_id,
    price,
    materials,
    stone,
    images,
    status,
    isBestSeller,
    name_en,
    description_en,
    name_tr,
    description_tr
  } = req.body;

  if (!category_id || !name_en || !name_tr || !description_en || !description_tr) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  db.run(
    `
    UPDATE products SET
      category_id = ?,
      subcategory_id = ?,
      price = ?,
      materials_json = ?,
      stone = ?,
      images_json = ?,
      status = ?,
      is_best_seller = ?
    WHERE id = ?
    `,
    [
      Number(category_id),
      subcategory_id ? Number(subcategory_id) : null,
      price != null && price !== "" ? Number(price) : null,
      JSON.stringify(materials || []),
      stone || "None",
      JSON.stringify(images || []),
      status || "available",
      isBestSeller ? 1 : 0,
      id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: "db_error" });
      if (this.changes === 0) return res.status(404).json({ error: "not_found" });

      db.run(
        `
        INSERT INTO product_translations (product_id, language, name, description)
        VALUES (?, 'en', ?, ?)
        ON CONFLICT(product_id, language) DO UPDATE SET
          name = excluded.name,
          description = excluded.description
        `,
        [id, name_en, description_en],
        (e1) => {
          if (e1) return res.status(500).json({ error: "db_error_translations_en" });

          db.run(
            `
            INSERT INTO product_translations (product_id, language, name, description)
            VALUES (?, 'tr', ?, ?)
            ON CONFLICT(product_id, language) DO UPDATE SET
              name = excluded.name,
              description = excluded.description
            `,
            [id, name_tr, description_tr],
            (e2) => {
              if (e2) return res.status(500).json({ error: "db_error_translations_tr" });
              res.json({ ok: true });
            }
          );
        }
      );
    }
  );
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  db.run("DELETE FROM product_translations WHERE product_id = ?", [id], (e1) => {
    if (e1) return res.status(500).json({ error: "db_error" });

    db.run("DELETE FROM products WHERE id = ?", [id], function (e2) {
      if (e2) return res.status(500).json({ error: "db_error" });
      res.json({ ok: true, deleted: this.changes });
    });
  });
});

// ---------- START ----------
ensureAdminUser();
seedTaxonomy();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running: http://localhost:${port}`);
});