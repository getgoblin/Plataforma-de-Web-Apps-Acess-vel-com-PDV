require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./lib/db');
const { authMiddleware, requireAuth, issueToken } = require('./lib/auth');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const clientRoutes = require('./routes/clients');
const orderRoutes = require('./routes/orders');

const app = express();
app.use(cors());
app.use(express.json());
app.use(authMiddleware);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/clients', clientRoutes);
app.use('/orders', orderRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[pdv-api] listening on http://localhost:${PORT}`);
});

