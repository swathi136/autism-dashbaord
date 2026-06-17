const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO consent
        (parent_guardian_name, relationship_to_child, contact_number, email_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [
        data.parent_guardian_name,
        data.relationship_to_child,
        data.contact_number,
        data.email_id
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM consent", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;