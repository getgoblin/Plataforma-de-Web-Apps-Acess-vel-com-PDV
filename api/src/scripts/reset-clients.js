#!/usr/bin/env node
// Danger: clears all clients from the DB. Keep orders intact.
// Usage: node src/scripts/reset-clients.js
require('dotenv').config();
const { db } = require('../lib/db');

const count = db.prepare('SELECT COUNT(*) AS n FROM clients').get().n;
db.prepare('DELETE FROM clients').run();
const after = db.prepare('SELECT COUNT(*) AS n FROM clients').get().n;
console.log(`[reset-clients] removed ${count} clients; remaining: ${after}`);

