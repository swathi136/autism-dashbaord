const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO environment
        (
            child_id,
            country,
            state,
            district,
            city_town_village,
            pin_code,
            location_type,
            current_place_of_residence,
            duration_of_stay_months,
            exposure_to_industrial_pollution,
            exposure_to_pesticides,
            drinking_water_source,
            house_type,
            exposure_to_pets_or_farm_animals,
            screen_exposure_time_daily
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.country,
        data.state,
        data.district,
        data.city_town_village,
        data.pin_code,
        data.location_type,
        data.current_place_of_residence,
        data.duration_of_stay_months,
        data.exposure_to_industrial_pollution,
        data.exposure_to_pesticides,
        data.drinking_water_source,
        data.house_type,
        data.exposure_to_pets_or_farm_animals,
        data.screen_exposure_time_daily
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM environment", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;