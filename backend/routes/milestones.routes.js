const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO milestones (
            child_id,
            neck_holding_age_months,
            sitting_age_months,
            crawling_age_months,
            standing_age_months,
            walking_age_months,
            first_words_age_months,
            developmental_delay_noticed
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.neck_holding_age_months,
        data.sitting_age_months,
        data.crawling_age_months,
        data.standing_age_months,
        data.walking_age_months,
        data.first_words_age_months,
        data.developmental_delay_noticed
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM milestones", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;