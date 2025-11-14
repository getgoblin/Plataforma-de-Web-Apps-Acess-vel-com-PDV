const express = require('express');
const router = express.Router();
const { db } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

router.get('/', requireAuth, (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const offset = (page - 1) * limit;
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);
  res.json(rows.map(mapOrder));
});

router.get('/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!o) return res.status(404).json({ error: 'not_found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  res.json({ ...mapOrder(o), items: items.map(mapItem) });
});

router.post('/', requireAuth, (req, res) => {
  const { client_id, client, payment_method, installments, items, order_discount } = req.body || {};
  if (!payment_method || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'invalid_body' });

  // compute
  let subtotal = 0, discountsUnit = 0;
  const mapped = [];
  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(it.product_id);
    if (!p) return res.status(400).json({ error: 'product_not_found', product_id: it.product_id });
    const qty = Math.max(1, parseInt(it.qty || 1, 10));
    const pct = Math.max(0, Math.min(100, Number(it.unit_discount_pct || 0)));
    const unit = p.price_cents;
    const lineSub = unit * qty;
    const lineDisc = Math.round(lineSub * (pct / 100));
    subtotal += lineSub;
    discountsUnit += lineDisc;
    mapped.push({ product_id: p.id, code_snapshot: p.code, name_snapshot: p.name, qty, unit_price_cents: unit, unit_discount_pct: pct });
  }
  const base = Math.max(0, subtotal - discountsUnit);
  let orderDiscountCents = 0;
  if (order_discount && typeof order_discount === 'object') {
    if (order_discount.type === 'value') orderDiscountCents = Math.max(0, Math.min(base, Math.round(order_discount.value || 0)));
    if (order_discount.type === 'percent') orderDiscountCents = Math.round(base * (Math.max(0, Math.min(100, Number(order_discount.value || 0))) / 100));
  }
  const total = Math.max(0, base - orderDiscountCents);

  // next sequence
  const seqRow = db.prepare('SELECT last_number FROM order_sequence WHERE id = 1').get();
  const next = (seqRow?.last_number || 0) + 1;

  const tx = db.transaction(() => {
    db.prepare('UPDATE order_sequence SET last_number = ? WHERE id = 1').run(next);
    const clientSnap = client ? JSON.stringify(client) : null;
    const info = db.prepare(`INSERT INTO orders(number_seq, client_id, client_snapshot, payment_method, installments, subtotal_cents, unit_discounts_cents, order_discount_cents, total_cents, status)
     VALUES(?,?,?,?,?,?,?,?,?, 'confirmed')`).run(next, client_id || null, clientSnap, payment_method, Math.max(1, parseInt(installments || 1, 10)), subtotal, discountsUnit, orderDiscountCents, total);
    const orderId = info.lastInsertRowid;
    const insItem = db.prepare(`INSERT INTO order_items(order_id, product_id, code_snapshot, name_snapshot, qty, unit_price_cents, unit_discount_pct) VALUES(?,?,?,?,?,?,?)`);
    for (const m of mapped) insItem.run(orderId, m.product_id || null, m.code_snapshot, m.name_snapshot, m.qty, m.unit_price_cents, m.unit_discount_pct);
    return orderId;
  });
  const orderId = tx();
  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const itemsCreated = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json({ ...mapOrder(created), items: itemsCreated.map(mapItem) });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!o) return res.status(404).json({ error: 'not_found' });
  db.prepare("UPDATE orders SET status = 'canceled' WHERE id = ?").run(id);
  res.json({ ok: true });
});

function mapOrder(o){
  return {
    id: o.id,
    number_seq: o.number_seq,
    client_id: o.client_id,
    client_snapshot: o.client_snapshot ? JSON.parse(o.client_snapshot) : null,
    payment_method: o.payment_method,
    installments: o.installments,
    subtotal_cents: o.subtotal_cents,
    unit_discounts_cents: o.unit_discounts_cents,
    order_discount_cents: o.order_discount_cents,
    total_cents: o.total_cents,
    status: o.status,
    created_at: o.created_at
  };
}
function mapItem(i){
  return { id: i.id, order_id: i.order_id, product_id: i.product_id, code_snapshot: i.code_snapshot, name_snapshot: i.name_snapshot, qty: i.qty, unit_price_cents: i.unit_price_cents, unit_discount_pct: i.unit_discount_pct };
}

module.exports = router;

