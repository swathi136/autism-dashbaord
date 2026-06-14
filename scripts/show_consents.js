const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: 'r00t', database: 'rehaab_db' });

db.connect(err => {
  if (err) { console.error('DB connect error', err); process.exit(1); }
  db.query('SELECT id, patient_id, data, created_at FROM consents ORDER BY created_at DESC LIMIT 20', (e,r) => {
    if (e) { console.error('Query error', e); process.exit(1); }
    console.log('consents rows:');
    console.table(r);
    process.exit(0);
  });
});