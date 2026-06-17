const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO sleep_and_behaviour (
            child_id,
            sleep_onset_difficulty,
            frequent_night_waking,
            early_morning_waking,
            total_sleep_duration_hours,
            daytime_sleepiness,
            aggression_frequency,
            tantrum_frequency,
            tantrum_triggers,
            calming_strategies
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.sleep_onset_difficulty,
        data.frequent_night_waking,
        data.early_morning_waking,
        data.total_sleep_duration_hours,
        data.daytime_sleepiness,
        data.aggression_frequency,
        data.tantrum_frequency,
        data.tantrum_triggers,
        data.calming_strategies
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM sleep_and_behaviour", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;