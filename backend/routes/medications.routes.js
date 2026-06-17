const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO medications
        (
            child_id,
            current_prescription_medicines,
            dose_and_duration,
            antiepileptic_drugs,
            antipsychotic_drugs,
            adhd_medications,
            sleep_medicines,
            antianxiety_medicines,
            digestive_medicines,
            laxatives,
            antibiotics,
            probiotics,
            multivitamins,
            vitamin_b12,
            vitamin_d,
            omega_3,
            magnesium,
            zinc,
            iron,
            folate,
            amino_acid_supplements,
            adverse_reaction_to_medicine_or_supplement
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.current_prescription_medicines,
        data.dose_and_duration,
        data.antiepileptic_drugs,
        data.antipsychotic_drugs,
        data.adhd_medications,
        data.sleep_medicines,
        data.antianxiety_medicines,
        data.digestive_medicines,
        data.laxatives,
        data.antibiotics,
        data.probiotics,
        data.multivitamins,
        data.vitamin_b12,
        data.vitamin_d,
        data.omega_3,
        data.magnesium,
        data.zinc,
        data.iron,
        data.folate,
        data.amino_acid_supplements,
        data.adverse_reaction_to_medicine_or_supplement
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM medications", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;