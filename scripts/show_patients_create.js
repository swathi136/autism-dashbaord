const db = require('../db');

db.query('SHOW CREATE TABLE patients', (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(rows[0]['Create Table']);
  process.exit(0);
});