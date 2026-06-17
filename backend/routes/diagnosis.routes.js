const express = require("express");
const router = express.Router();
const db = require("../db"); // ONLY this import

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO diagnosis (
            child_id,
            age_at_first_concern,
            age_at_diagnosis
        )
        VALUES (?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.age_at_first_concern,
        data.age_at_diagnosis
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET
router.get("/", (req, res) => {
    db.query("SELECT * FROM diagnosis", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;