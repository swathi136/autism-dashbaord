const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO treatments (
            child_id,
            speech_therapy,
            occupational_therapy,
            behaviour_therapy_aba,
            medication,
            parent_perceived_improvement
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.speech_therapy,
        data.occupational_therapy,
        data.behaviour_therapy_aba,
        data.medication,
        data.parent_perceived_improvement
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM treatments", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;