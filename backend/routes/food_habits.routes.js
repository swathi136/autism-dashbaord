const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO food_habits (
            child_id,
            diet_type,
            food_selectivity,
            appetite,
            water_intake_liters
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.diet_type,
        data.food_selectivity,
        data.appetite,
        data.water_intake_liters
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM food_habits", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;