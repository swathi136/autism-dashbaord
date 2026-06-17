const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO uploads
        (
            child_id,
            autism_diagnosis_report,
            previous_lab_reports,
            amino_acid_profile_report,
            prescription_copy,
            therapy_assessment_report,
            developmental_assessment_report,
            diet_chart,
            stool_gut_test_report,
            genetic_test_report,
            parent_observation_notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.autism_diagnosis_report,
        data.previous_lab_reports,
        data.amino_acid_profile_report,
        data.prescription_copy,
        data.therapy_assessment_report,
        data.developmental_assessment_report,
        data.diet_chart,
        data.stool_gut_test_report,
        data.genetic_test_report,
        data.parent_observation_notes
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM uploads", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;