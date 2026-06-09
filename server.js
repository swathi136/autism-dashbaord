const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
// allow larger JSON payloads from the client (forms can be sizable)
app.use(express.json({ limit: '5mb' }));
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
  console.log('[/api/save-form] incoming body keys:', Object.keys(req.body || {}));
  console.log('[/api/save-form] body preview:', JSON.stringify(req.body ? {
    patient_name: req.body.patient_name,
    parent_email: req.body.parent_email,
    created_by_email: req.body.created_by_email,
    sections_keys: req.body.sections ? Object.keys(req.body.sections) : undefined
  } : {}));

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

  // map common demographic fields into patients table
  function updatePatientFromDemographics(patientId, demographics, userId, cb) {
    if (!demographics || typeof demographics !== 'object') return cb(null);
    // helper to find value by regex key
    function findValue(obj, regex) {
      for (const k of Object.keys(obj)) {
        if (regex.test(k)) return obj[k];
      }
      return undefined;
    }

    const ageRaw = findValue(demographics, /\bage\b/i) || findValue(demographics, /age of/i);
    const dobRaw = findValue(demographics, /date of birth|dob|birth/i);
    const genderRaw = findValue(demographics, /gender/i);
    const heightRaw = findValue(demographics, /height/i);
    const weightRaw = findValue(demographics, /weight/i);
    const bmiRaw = findValue(demographics, /bmi/i);
    const bloodGroupRaw = findValue(demographics, /blood/i);
    const schoolStatusRaw = findValue(demographics, /school-going|school status|school/i);
    const classGradeRaw = findValue(demographics, /class|grade/i);
    const primaryCaregiverRaw = findValue(demographics, /primary caregiver/i);

    const updates = [];
    const params = [];
    if (ageRaw !== undefined && ageRaw !== '') { const a = parseInt(String(ageRaw).replace(/[^0-9\-]/g,''),10); if (!isNaN(a)) { updates.push('age=?'); params.push(a); } }
    if (dobRaw) { // try to normalize to YYYY-MM-DD if possible
      const d = new Date(dobRaw);
      if (!isNaN(d.getTime())) { const iso = d.toISOString().split('T')[0]; updates.push('dob=?'); params.push(iso); }
      else { updates.push('dob=?'); params.push(dobRaw); }
    }
    if (genderRaw) { updates.push('gender=?'); params.push(String(genderRaw).trim()); }
    if (heightRaw) { const h = parseFloat(String(heightRaw).replace(/[^0-9\.\-]/g,'')); if (!isNaN(h)) { updates.push('height=?'); params.push(h); } }
    if (weightRaw) { const w = parseFloat(String(weightRaw).replace(/[^0-9\.\-]/g,'')); if (!isNaN(w)) { updates.push('weight=?'); params.push(w); } }
    if (bmiRaw) { const b = parseFloat(String(bmiRaw).replace(/[^0-9\.\-]/g,'')); if (!isNaN(b)) { updates.push('bmi=?'); params.push(b); } }
    if (bloodGroupRaw) { updates.push('blood_group=?'); params.push(String(bloodGroupRaw).trim()); }
    if (schoolStatusRaw) { updates.push('school_status=?'); params.push(String(schoolStatusRaw).trim()); }
    if (classGradeRaw) { updates.push('class_grade=?'); params.push(String(classGradeRaw).trim()); }
    if (primaryCaregiverRaw) { updates.push('primary_caregiver=?'); params.push(String(primaryCaregiverRaw).trim()); }
    if (userId) { updates.push('created_by=?'); params.push(userId); }

    if (updates.length === 0) return cb(null);
    const sql = `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`;
    params.push(patientId);
    db.query(sql, params, (err) => {
      if (err) return cb(err);
      cb(null);
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

  // find or create patient (allow creating a minimal patient even if identifiers missing)
  // accepts userId to set created_by when creating a new patient
  function findOrCreatePatient(userId, cb) {
    db.query('SELECT id FROM patients WHERE (child_name = ? AND child_name IS NOT NULL) OR (parent_email = ? AND parent_email IS NOT NULL) LIMIT 1', [patient_name || '', parent_email || ''], (err, rows) => {
      if (err) return cb(err);
      if (rows.length > 0) return cb(null, rows[0].id);
      // create minimal patient (allow null values)
      const nameForInsert = (patient_name && patient_name.trim()) ? patient_name.trim() : 'Unknown';
      const insertSql = 'INSERT INTO patients (child_name, parent_name, parent_email, created_at) VALUES (?,?,?,NOW())';
      db.query(insertSql, [nameForInsert, null, parent_email || null], (err2, result) => {
        if (err2) return cb(err2);
        const newId = result.insertId;
        // if we have a userId, set patients.created_by
        if (userId) {
          db.query('UPDATE patients SET created_by = ? WHERE id = ?', [userId, newId], () => {
            // ignore update error, return patient id anyway
            return cb(null, newId);
          });
        } else {
          cb(null, newId);
        }
      });
    });
  }

  // orchestrate
  findUserId(created_by_email, (errU, userId) => {
    if (errU) {
      console.error('[/api/save-form] user lookup error:', errU);
      return res.status(500).json({ success: false, message: 'DB error (user lookup)', error: errU.message });
    }
    findOrCreatePatient(userId, (errP, patientId) => {
      if (errP) {
        console.error('[/api/save-form] patient error:', errP);
        return res.status(400).json({ success: false, message: errP.message || 'Patient error', error: errP.message });
      }
      // update patient record with demographic fields when available
      const demographics = sections && sections.demographics ? sections.demographics : null;
      updatePatientFromDemographics(patientId, demographics, userId, (errU) => {
        if (errU) {
          console.error('[/api/save-form] update patient error:', errU);
          return res.status(500).json({ success: false, message: 'Failed to update patient', error: errU.message });
        }
        insertSection(patientId, (errS, sectionId) => {
          if (errS) {
            console.error('[/api/save-form] insert section error:', errS);
            return res.status(500).json({ success: false, message: 'Failed to save section', error: errS.message });
          }
          res.json({ success: true, patient_id: patientId, section_id: sectionId });
        });
      });
    });
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});