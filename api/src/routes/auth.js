const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');
const { issueToken, bcrypt } = require('../lib/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
  const token = issueToken(row);
  res.json({ token, user: { id: row.id, email: row.email, name: row.name } });
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  const token = auth.substring(7);
  try {
    const payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'change-me');
    res.json({ user: payload });
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
});

module.exports = router;


// simple self-serve registration (dev only)
router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_and_password_required' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'email_in_use' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users(email, password_hash, name) VALUES(?,?,?)').run(email, hash, name || null);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = issueToken(row);
  res.status(201).json({ token, user: { id: row.id, email: row.email, name: row.name } });
});
