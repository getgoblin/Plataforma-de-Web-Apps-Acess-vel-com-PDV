const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

router.get('/', (req, res) => {
  const search = (req.query.search || '').toString().trim();
  let rows;
  if (search) {
    const like = `%${search}%`;
    rows = db.prepare('SELECT * FROM products WHERE active = 1 AND (name LIKE ? OR code LIKE ?) ORDER BY name LIMIT 100').all(like, like);
  } else {
    rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY name LIMIT 200').all();
  }
  res.json(rows.map(mapProduct));
});

router.post('/', requireAuth, (req, res) => {
  const { code, name, price_cents, stock } = req.body || {};
  if (!code || !name || typeof price_cents !== 'number') return res.status(400).json({ error: 'invalid_body' });
  try {
    const stmt = db.prepare('INSERT INTO products(code, name, price_cents, stock, active) VALUES (?,?,?,?,1)');
    const info = stmt.run(code, name, price_cents, stock ?? 0);
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(mapProduct(row));
  } catch (e) {
    res.status(400).json({ error: 'db_error', detail: e.message });
  }
});

function mapProduct(r){
  return { id: r.id, code: r.code, name: r.name, price_cents: r.price_cents, stock: r.stock, active: !!r.active };
}

module.exports = router;

