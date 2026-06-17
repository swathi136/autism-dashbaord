const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO treatment_history (
            child_id,
            previous_therapies_tried,
            previous_medications,
            previous_hospitalizations
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.previous_therapies_tried,
        data.previous_medications,
        data.previous_hospitalizations
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM treatment_history", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;