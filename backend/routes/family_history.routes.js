const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO family_history (
            child_id,
            family_history_asd,
            family_history_adhd,
            family_history_epilepsy,
            sibling_with_asd_or_neurodevelopmental_condition
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.family_history_asd,
        data.family_history_adhd,
        data.family_history_epilepsy,
        data.sibling_with_asd_or_neurodevelopmental_condition
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM family_history", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;