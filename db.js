const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "r00t",
  database: "rehaab_db"
});

// Ensure the database name matches the created schema (rehaab_db)

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected");
});

module.exports = db;