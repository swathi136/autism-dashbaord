const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "reehab_db"
});

// Ensure the database name matches the created schema (reehab_db)

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected");
});

module.exports = db;