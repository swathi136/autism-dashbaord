const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO amino_acid_profile (
            child_id,
            sample_collection_date,
            alanine,
            glycine,
            valine
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.sample_collection_date,
        data.alanine,
        data.glycine,
        data.valine
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM amino_acid_profile", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;