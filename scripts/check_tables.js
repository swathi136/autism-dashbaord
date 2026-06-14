const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: 'r00t', database: 'rehaab_db' });

db.connect(err => {
  if (err) { console.error('DB connect error', err); process.exit(1); }
  console.log('Connected.');
  db.query("SHOW TABLES LIKE 'consents'", (e,r) => { console.log('consents ->', r); db.query("SHOW TABLES LIKE 'patient_demographics'", (e2,r2) => { console.log('patient_demographics ->', r2); db.query("SHOW TABLES LIKE 'parents'", (e3,r3) => { console.log('parents ->', r3); process.exit(0); }); }); });
});