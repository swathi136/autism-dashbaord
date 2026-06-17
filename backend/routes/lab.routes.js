const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO lab_data
        (
            child_id,
            cbc,
            hemoglobin,
            ferritin,
            vitamin_b12,
            vitamin_d,
            folate,
            thyroid_profile,
            liver_function_test,
            kidney_function_test,
            blood_glucose,
            hba1c,
            crp_inflammation_markers,
            lactate,
            ammonia,
            homocysteine,
            stool_test,
            allergy_test,
            genetic_test
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.cbc,
        data.hemoglobin,
        data.ferritin,
        data.vitamin_b12,
        data.vitamin_d,
        data.folate,
        data.thyroid_profile,
        data.liver_function_test,
        data.kidney_function_test,
        data.blood_glucose,
        data.hba1c,
        data.crp_inflammation_markers,
        data.lactate,
        data.ammonia,
        data.homocysteine,
        data.stool_test,
        data.allergy_test,
        data.genetic_test
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM lab_data", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;