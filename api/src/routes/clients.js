const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

router.get('/', (req, res) => {
  const q = (req.query.query || '').toString().trim();
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  if (!q) {
    const rows = db.prepare('SELECT * FROM clients ORDER BY created_at DESC LIMIT ?').all(limit);
    return res.json(rows.map(mapClient));
  }
  const like = `%${q}%`;
  const rows = db.prepare(`SELECT * FROM clients WHERE
    (name LIKE ? OR email LIKE ? OR phone LIKE ? OR document LIKE ?) 
    ORDER BY created_at DESC LIMIT ?`).all(like, like, like, like, limit);
  res.json(rows.map(mapClient));
});

// Create or upsert a client (merge by document/email/phone if exists)
router.post('/', requireAuth, (req, res) => {
  const { name, email, phone, document, anonymous } = req.body || {};

  // Try to find an existing client by unique-ish keys
  const existing = db.prepare(`SELECT * FROM clients WHERE 
    (document IS NOT NULL AND document = ?) OR 
    (email IS NOT NULL AND LOWER(email) = LOWER(?)) OR 
    (phone IS NOT NULL AND phone = ?)
    ORDER BY created_at DESC LIMIT 1`)
    .get(document || null, email || null, phone || null);

  if (existing) {
    const merged = {
      name: (name ?? existing.name) || existing.name,
      email: (email ?? existing.email) || existing.email,
      phone: (phone ?? existing.phone) || existing.phone,
      document: (document ?? existing.document) || existing.document,
      anonymous: typeof anonymous === 'boolean' ? (anonymous ? 1 : 0) : existing.anonymous,
    };
    db.prepare('UPDATE clients SET name=?, email=?, phone=?, document=?, anonymous=? WHERE id=?')
      .run(merged.name || null, merged.email || null, merged.phone || null, merged.document || null, merged.anonymous ? 1 : 0, existing.id);
    const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(existing.id);
    return res.status(200).json(mapClient(row));
  }

  // Insert new with constraint fallback (race-safe)
  try {
    const stmt = db.prepare(`INSERT INTO clients(name, email, phone, document, anonymous) VALUES(?,?,?,?,?)`);
    const info = stmt.run(name || null, email || null, phone || null, document || null, anonymous ? 1 : 0);
    const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json(mapClient(row));
  } catch (err) {
    // If unique constraint triggers because another request created it in between, merge
    if (err && String(err.code || '').startsWith('SQLITE_CONSTRAINT')) {
      const again = db.prepare(`SELECT * FROM clients WHERE 
        (document IS NOT NULL AND document = ?) OR 
        (email IS NOT NULL AND LOWER(email) = LOWER(?)) OR 
        (phone IS NOT NULL AND phone = ?) 
        ORDER BY created_at DESC LIMIT 1`).get(document || null, email || null, phone || null);
      if (again) {
        const merged = {
          name: (name ?? again.name) || again.name,
          email: (email ?? again.email) || again.email,
          phone: (phone ?? again.phone) || again.phone,
          document: (document ?? again.document) || again.document,
          anonymous: typeof anonymous === 'boolean' ? (anonymous ? 1 : 0) : again.anonymous,
        };
        db.prepare('UPDATE clients SET name=?, email=?, phone=?, document=?, anonymous=? WHERE id=?')
          .run(merged.name || null, merged.email || null, merged.phone || null, merged.document || null, merged.anonymous ? 1 : 0, again.id);
        const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(again.id);
        return res.status(200).json(mapClient(row));
      }
    }
    throw err;
  }
});

// Merge/update existing client. Only provided fields overwrite current values.
router.put('/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { name, email, phone, document, anonymous } = req.body || {};
  const next = {
    name: (name ?? existing.name) || existing.name,
    email: (email ?? existing.email) || existing.email,
    phone: (phone ?? existing.phone) || existing.phone,
    document: (document ?? existing.document) || existing.document,
    anonymous: typeof anonymous === 'boolean' ? (anonymous ? 1 : 0) : existing.anonymous,
  };
  db.prepare('UPDATE clients SET name=?, email=?, phone=?, document=?, anonymous=? WHERE id=?')
    .run(next.name || null, next.email || null, next.phone || null, next.document || null, next.anonymous ? 1 : 0, id);
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.json(mapClient(row));
});

function mapClient(r){
  return { id: r.id, name: r.name, email: r.email, phone: r.phone, document: r.document, anonymous: !!r.anonymous, created_at: r.created_at };
}

module.exports = router;
