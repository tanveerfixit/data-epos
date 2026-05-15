const Database = require('better-sqlite3');
const db = new Database('pos.db');

const tables = [
  'categories', 'products', 'product_skus', 'invoice_items', 'invoices', 
  'branch_stock', 'devices', 'inventory_movements', 'product_activity'
];

console.log('Table Counts:');
for (const table of tables) {
  try {
    const row = db.prepare(`SELECT count(*) as count FROM ${table}`).get();
    console.log(`${table}: ${row.count}`);
  } catch (e) {
    console.log(`${table}: Table does not exist or error ${e.message}`);
  }
}
db.close();
