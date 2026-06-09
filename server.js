const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, hash, role], (err) => {
      if (err) return res.json({ success: false, message: "User already exists or DB error" });
      res.json({ success: true, message: "Registered successfully" });
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post("/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  const sql = "SELECT * FROM users WHERE email=? AND role=? LIMIT 1";
  db.query(sql, [email, role], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    if (result.length === 0) return res.json({ success: false, message: 'Invalid login' });
    const user = result[0];
    bcrypt.compare(password, user.password, (err2, same) => {
      if (err2) return res.status(500).json({ success: false });
      if (!same) return res.json({ success: false, message: 'Invalid login' });
      // remove password before returning
      delete user.password;
      res.json({ success: true, user });
    });
  });
});

// Save full form into patient_sections; create patient if needed
app.post('/api/save-form', (req, res) => {
  const { patient_name, parent_email, sections, created_by_email } = req.body || {};

  // helper to continue insert once we have a patient_id
  function insertSection(patientId, cb) {
    const data = JSON.stringify(sections || {});
    const sql = 'INSERT INTO patient_sections (patient_id, section_name, data) VALUES (?,?,?)';
    db.query(sql, [patientId, 'full_form', data], (err, result) => {
      if (err) return cb(err);
      cb(null, result.insertId);
    });
  }

  // find user id (created_by) if email provided
  function findUserId(email, cb) {
    if (!email) return cb(null, null);
    db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email], (err, rows) => {
      if (err) return cb(err);
      if (rows.length === 0) return cb(null, null);
      cb(null, rows[0].id);
    });
  }

  // find or create patient
  function findOrCreatePatient(cb) {
    if (!patient_name && !parent_email) return cb(new Error('No patient identifier provided'));
    db.query('SELECT id FROM patients WHERE child_name = ? OR parent_email = ? LIMIT 1', [patient_name || '', parent_email || ''], (err, rows) => {
      if (err) return cb(err);
      if (rows.length > 0) return cb(null, rows[0].id);
      // create minimal patient
      const insertSql = 'INSERT INTO patients (child_name, parent_name, parent_email, created_at) VALUES (?,?,?,NOW())';
      db.query(insertSql, [patient_name || null, null, parent_email || null], (err2, result) => {
        if (err2) return cb(err2);
        cb(null, result.insertId);
      });
    });
  }

  // orchestrate
  findUserId(created_by_email, (errU, userId) => {
    if (errU) return res.status(500).json({ success: false, message: 'DB error (user lookup)' });
    findOrCreatePatient((errP, patientId) => {
      if (errP) return res.status(400).json({ success: false, message: errP.message || 'Patient error' });
      insertSection(patientId, (errS, sectionId) => {
        if (errS) return res.status(500).json({ success: false, message: 'Failed to save section' });
        res.json({ success: true, patient_id: patientId, section_id: sectionId });
      });
    });
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});