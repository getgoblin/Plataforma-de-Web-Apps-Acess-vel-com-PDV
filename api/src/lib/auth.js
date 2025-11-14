const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function issueToken(user) {
  const payload = { sub: user.id, email: user.email, name: user.name };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.substring(7);
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

module.exports = { issueToken, authMiddleware, requireAuth, bcrypt };

