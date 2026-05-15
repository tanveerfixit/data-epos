const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    // 1. Update branch-specific users to 'admin' role. 
    // The 'superadmin' role in this system bypasses branch isolation (designed for business owners).
    // The 'admin' role correctly filters by branch_id.
    await pool.execute(
      "UPDATE users SET role = 'admin' WHERE email NOT IN ('tanveerfixit@gmail.com', 'support@techinbox.ie') AND role != 'developer'"
    );
    console.log('Branch users updated to admin role for isolation.');
  } finally {
    await pool.end();
  }
}
run();
