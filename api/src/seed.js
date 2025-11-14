require('dotenv').config();
const { db } = require('./lib/db');
const { bcrypt } = require('./lib/auth');

function upsertUser(email, name, password){
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (row) return row.id;
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users(email, password_hash, name) VALUES(?,?,?)').run(email, hash, name);
  return info.lastInsertRowid;
}

function upsertProduct(code, name, price_cents, stock){
  const row = db.prepare('SELECT id FROM products WHERE code = ?').get(code);
  if (row) {
    // atualiza quando j� existe (corrige acentos e valores)
    db.prepare('UPDATE products SET name = ?, price_cents = ?, stock = ?, active = 1 WHERE code = ?')
      .run(name, price_cents, stock ?? 0, code);
    return row.id;
  }
  const info = db.prepare('INSERT INTO products(code, name, price_cents, stock, active) VALUES(?,?,?,?,1)')
    .run(code, name, price_cents, stock ?? 0);
  return info.lastInsertRowid;
}

function main(){
  console.log('[seed] creating default user...');
  upsertUser('admin@example.com', 'Admin', 'admin123');

  console.log('[seed] inserting products (suplementos)...');
  const products = [
    ['SUP-1001', 'Whey Protein Concentrado 900g', 14990, 120],
    ['SUP-1002', 'Creatina Monohidratada 300g',    9990, 200],
    ['SUP-1003', 'BCAA 120 capsulas',              7990, 180],
    ['SUP-1004', 'Pré-treino 300g',                8990, 150],
    ['SUP-1005', 'Glutamina 300g',                 8990, 140],
    ['SUP-1006', 'Multivitamínico 90 cápsulas',    6990, 160],
    ['SUP-1007', 'Omega-3 120 cápsulas',           5990, 170],
    ['SUP-1008', 'Hipercalórico 3kg',             17990, 100],
    ['SUP-1009', 'Barra Proteica 40g',             1290, 500],
    ['SUP-1010', 'Coqueteleira 700ml',             3990, 250]
  ];
  for (const p of products) upsertProduct(...p);
  console.log('[seed] done.');
}

main();



