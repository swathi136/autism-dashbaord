const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO gi_and_metabolic_history (
            child_id,
            constipation,
            diarrhea,
            bloating,
            abdominal_pain
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.constipation,
        data.diarrhea,
        data.bloating,
        data.abdominal_pain
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM gi_and_metabolic_history", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;