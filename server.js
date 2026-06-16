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
      // create minimal patient (allow empty values). If patient_name is missing, insert empty string
      const nameForInsert = (patient_name && patient_name.trim()) ? patient_name.trim() : '';
      const insertSql = 'INSERT INTO patients (child_name, parent_name, parent_email, created_at) VALUES (?,?,?,NOW())';
      console.log('[/api/save-form] creating patient with:', { nameForInsert, parent_email: parent_email || null });
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

        // Save consent section separately if present
        const consentData = sections && sections.consent ? sections.consent : null;
        function saveConsent(cb) {
          if (!consentData) return cb(null);
          const consentJson = JSON.stringify(consentData);
          const sql = 'INSERT INTO consents (patient_id, data, created_at) VALUES (?,?,NOW())';
          db.query(sql, [patientId, consentJson], (err, result) => {
            if (err) return cb(err);
            cb(null, result.insertId);
          });
        }

        // Save demographics section into dedicated table as JSON as well
        function saveDemographics(cb) {
          if (!demographics) return cb(null);
          const demoJson = JSON.stringify(demographics);
          const sql = 'INSERT INTO patient_demographics (patient_id, data, created_at) VALUES (?,?,NOW())';
          db.query(sql, [patientId, demoJson], (err, result) => {
            if (err) return cb(err);
            cb(null, result.insertId);
          });
        }

        // Save environment section into typed patient_environment table and keep raw JSON
        function saveEnvironment(cb) {
          const env = sections && sections.environment ? sections.environment : null;
          console.log('[/api/save-form] saveEnvironment env present?:', env !== null, 'type:', typeof env, 'env keys:', env && typeof env === 'object' ? Object.keys(env) : null);
          if (!env || typeof env !== 'object') return cb(null);
          // map common keys (tolerant to different label names)
          const country = env.country || env['1. Country'] || null;
          const state = env.state || env['2. State'] || null;
          const district = env.district || env['3. District'] || null;
          const city = env.city || env['4. City / town / village'] || env['4. City / town / village'] || env['city'] || null;
          const pin_code = env.pin_code || env['5. Pin code'] || env['pin code'] || null;
          const urbanity = env['6. Urban / semi-urban / rural location'] || env.urbanity || env.urban || null;
          const current_residence = env['7. Current place of residence'] || env.current_residence || null;
          const duration_of_stay = env['8. Duration of stay in present location'] || env.duration_of_stay || null;
          const exposure_industrial = env['9. Exposure to industrial pollution'] || env.exposure_industrial || null;
          const exposure_pesticides = env['10. Exposure to pesticides / agricultural chemicals'] || env.exposure_pesticides || null;
          const drinking_water_source = env['11. Drinking water source'] || env.drinking_water_source || null;
          const house_type = env['12. Type of house'] || env.house_type || null;
          const exposure_pets = env['13. Exposure to pets or farm animals'] || env.exposure_pets || null;
          const screen_time = env['14. Screen exposure time daily'] || env.screen_time || null;

          const raw = JSON.stringify(env);
          const sql = `INSERT INTO patient_environment (patient_id,country,state,district,city,pin_code,urbanity,current_residence,duration_of_stay,exposure_industrial,exposure_pesticides,drinking_water_source,house_type,exposure_pets,screen_time,raw_data,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`;
          const params = [patientId,country,state,district,city,pin_code,urbanity,current_residence,duration_of_stay,exposure_industrial,exposure_pesticides,drinking_water_source,house_type,exposure_pets,screen_time,raw];
          console.log('[/api/save-form] saveEnvironment params:', params.map(p => (p && p.length && p.length > 200) ? (String(p).slice(0,200)+'...') : p));
          db.query(sql, params, (err, result) => {
            if (err) {
              console.error('[/api/save-form] saveEnvironment db error:', err);
              return cb(err);
            }
            console.log('[/api/save-form] saveEnvironment inserted id:', result.insertId);
            cb(null, result.insertId);
          });
        }

        // After saving the specific sections, still save the combined full_form into patient_sections
        // Save parent contact into `parents` table when consent contains parent info
        function saveParent(cb) {
          if (!consentData || typeof consentData !== 'object') return cb(null);
          const parentName = consentData.parent_name || consentData['1. Parent/guardian name'] || null;
          const relationship = consentData.relationship || consentData['2. Relationship to child'] || null;
          const contactNumber = consentData.contact_number || consentData['3. Contact number'] || null;
          const parentEmail = consentData.parent_email || consentData['4. Email ID'] || parent_email || null;
          if (!parentName && !parentEmail && !contactNumber) return cb(null);
          const sql = 'INSERT INTO parents (patient_id, parent_name, relationship, contact_number, parent_email, created_at) VALUES (?,?,?,?,?,NOW())';
          db.query(sql, [patientId, parentName, relationship, contactNumber, parentEmail], (err, result) => {
            if (err) return cb(err);
            cb(null, result.insertId);
          });
        }

        saveConsent((errC, consentId) => {
          if (errC) {
            console.error('[/api/save-form] save consent error:', errC);
            return res.status(500).json({ success: false, message: 'Failed to save consent', error: errC.message });
          }
            saveDemographics((errD, demoId) => {
            if (errD) {
              console.error('[/api/save-form] save demographics error:', errD);
              return res.status(500).json({ success: false, message: 'Failed to save demographics', error: errD.message });
            }
            // also save parent contact
            saveParent((errP, parentId) => {
              if (errP) {
                console.error('[/api/save-form] save parent error:', errP);
                return res.status(500).json({ success: false, message: 'Failed to save parent', error: errP.message });
              }
              // save environment typed table
              saveEnvironment((errE, envId) => {
                if (errE) {
                  console.error('[/api/save-form] save environment error:', errE);
                  return res.status(500).json({ success: false, message: 'Failed to save environment', error: errE.message });
                }
                insertSection(patientId, (errS, sectionId) => {
                  if (errS) {
                    console.error('[/api/save-form] insert section error:', errS);
                    return res.status(500).json({ success: false, message: 'Failed to save section', error: errS.message });
                  }
                  res.json({ success: true, patient_id: patientId, consent_id: consentId || null, demographics_id: demoId || null, parent_id: parentId || null, environment_id: envId || null, section_id: sectionId });
                });
              });
            });
          });
        });
      });
    });
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});