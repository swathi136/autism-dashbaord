const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO diagnosis
        (
            child_id,
            age_at_first_concern,
            age_at_diagnosis,
            diagnosed_by,
            diagnosis,
            severity,
            diagnostic_tool,
            cars_score,
            ados_score,
            isaa_score,
            iq_or_dq,
            language_level,
            regression_history,
            age_of_regression,
            skills_lost
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.age_at_first_concern,
        data.age_at_diagnosis,
        data.diagnosed_by,
        data.diagnosis,
        data.severity,
        data.diagnostic_tool,
        data.cars_score,
        data.ados_score,
        data.isaa_score,
        data.iq_or_dq,
        data.language_level,
        data.regression_history,
        data.age_of_regression,
        data.skills_lost
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM diagnosis", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;