const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE
router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
        INSERT INTO medical_history
        (
            child_id,
            mother_age_at_pregnancy,
            father_age_at_conception,
            consanguineous_marriage,
            mode_of_conception,
            pregnancy_complications,
            maternal_diabetes,
            maternal_hypertension,
            thyroid_disorder_during_pregnancy,
            infection_during_pregnancy,
            medication_use_during_pregnancy,
            antibiotic_use_during_pregnancy,
            fever_during_pregnancy,
            toxin_or_chemical_exposure_during_pregnancy,
            delivery_type,
            gestational_age_weeks,
            birth_weight_kg,
            nicu_admission,
            birth_asphyxia_or_delayed_cry,
            neonatal_jaundice,
            seizures_after_birth,
            breastfeeding_duration_months,
            formula_feeding_history,
            weaning_age_months,
            vaccination_status,
            adverse_events_after_vaccination
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.mother_age_at_pregnancy,
        data.father_age_at_conception,
        data.consanguineous_marriage,
        data.mode_of_conception,
        data.pregnancy_complications,
        data.maternal_diabetes,
        data.maternal_hypertension,
        data.thyroid_disorder_during_pregnancy,
        data.infection_during_pregnancy,
        data.medication_use_during_pregnancy,
        data.antibiotic_use_during_pregnancy,
        data.fever_during_pregnancy,
        data.toxin_or_chemical_exposure_during_pregnancy,
        data.delivery_type,
        data.gestational_age_weeks,
        data.birth_weight_kg,
        data.nicu_admission,
        data.birth_asphyxia_or_delayed_cry,
        data.neonatal_jaundice,
        data.seizures_after_birth,
        data.breastfeeding_duration_months,
        data.formula_feeding_history,
        data.weaning_age_months,
        data.vaccination_status,
        data.adverse_events_after_vaccination
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

// GET ALL
router.get("/", (req, res) => {
    db.query("SELECT * FROM medical_history", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;