const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO demographics 
        (child_full_name, age, date_of_birth, gender)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_full_name,
        data.age,
        data.date_of_birth,
        data.gender
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM demographics", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;