const express = require("express");
const router = express.Router();
const db = require("../db");

function v(obj, key) {
    if (!obj) return null;
    const val = obj[key];
    return val === "" || val === undefined ? null : val;
}

router.post("/", async (req, res) => {
    const { patient_name, parent_email, sections, created_by_email } = req.body;

    if (!sections) {
        return res.status(400).json({ success: false, message: "Missing sections data" });
    }

    const consent = sections.consent || {};
    const demographics = sections.demographics || {};
    const environment = sections.environment || {};
    const diagnosis = sections.diagnosis || {};
    const medical = sections.medical || {};
    const milestones = sections.milestones || {};
    const family = sections.family || {};
    const food = sections.food || {};
    const gi = sections.gi_metabolic || {};
    const sleep = sections.sleep || {};
    const treatments = sections.treatments || {};
    const history = sections.history || {};
    const medications = sections.medications || {};
    const lab = sections.lab || {};
    const amino = sections.amino || {};
    const uploads = sections.uploads || {};

    db.beginTransaction((txErr) => {
        if (txErr) {
            return res.status(500).json({ success: false, error: txErr.message });
        }

        const demoSql = `
            INSERT INTO demographics
            (
                child_full_name,
                age,
                date_of_birth,
                gender,
                height,
                weight,
                bmi,
                blood_group,
                school_going_status,
                school_type,
                class_grade,
                primary_caregiver
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const demoValues = [
            v(demographics, "1. Child’s full name") || patient_name,
            v(demographics, "2. Age"),
            v(demographics, "3. Date of birth"),
            v(demographics, "4. Gender"),
            v(demographics, "5. Height"),
            v(demographics, "6. Weight"),
            v(demographics, "7. BMI"),
            v(demographics, "8. Blood group"),
            ["yes", "ongoing", "school going", "true", "1"].includes(
                String(v(demographics, "9. School-going status") || "").trim().toLowerCase()
            ) ? 1 : 0,
            v(demographics, "10. Type of school: mainstream /inclusive/ special school / home schooling"),
            v(demographics, "11. Class / grade"),
            v(demographics, "12. Primary caregiver")
        ];

        db.query(demoSql, demoValues, (demoErr, demoResult) => {
            if (demoErr) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, table: "demographics", error: demoErr.sqlMessage || demoErr.message })
                );
            }

            const child_id = demoResult.insertId;

            const tasks = [
                {
                    name: "consent",
                    sql: `
                        INSERT INTO consent
                        (parent_guardian_name, relationship_to_child, contact_number, email_id)
                        VALUES (?, ?, ?, ?)
                    `,
                    values: [
                        v(consent, "1. Parent/guardian name"),
                        v(consent, "2. Relationship to child"),
                        v(consent, "3. Contact number"),
                        v(consent, "4. Email ID") || parent_email
                    ]
                },
                {
                    name: "environment",
                    sql: `
                        INSERT INTO environment
                        (
                            child_id, country, state, district, city_town_village, pin_code,
                            location_type, current_place_of_residence, duration_of_stay_months,
                            exposure_to_industrial_pollution, exposure_to_pesticides,
                            drinking_water_source, house_type,
                            exposure_to_pets_or_farm_animals, screen_exposure_time_daily
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        v(environment, "1. Country"),
                        v(environment, "2. State"),
                        v(environment, "3. District"),
                        v(environment, "4. City / town / village"),
                        v(environment, "5. Pin code"),
                        (() => {
                            const raw = String(v(environment, "6. Urban / semi-urban / rural location") || "").trim().toLowerCase();
                            if (raw === "urban") return "Urban";
                            if (raw === "semi-urban" || raw === "semi urban" || raw === "semiurban") return "Semi-Urban";
                            if (raw === "rural") return "Rural";
                            return null;
                        })(),
                        v(environment, "7. Current place of residence"),
                        v(environment, "8. Duration of stay in present location"),
                        v(environment, "9. Exposure to industrial pollution"),
                        v(environment, "10. Exposure to pesticides / agricultural chemicals"),
                        v(environment, "11. Drinking water source"),
                        v(environment, "12. Type of house: apartment / independent house / rural house"),
                        v(environment, "13. Exposure to pets or farm animals"),
                        v(environment, "14. Screen exposure time daily")
                    ]
                },
                {
    name: "diagnosis",
    sql: `
        INSERT INTO diagnosis
        (
            child_id,
            age_at_first_concern,
            age_at_diagnosis,
            diagnosed_by,
            diagnosis_given,
            severity_level,
            diagnostic_tool_used,
            cars_score,
            ados2_score,
            isaa_score,
            iq_developmental_quotient,
            language_level,
            regression_history,
            age_of_regression,
            skills_lost_during_regression
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    values: [
        child_id,
        v(diagnosis, "1. Age at first concern noticed"),
        v(diagnosis, "2. Age at diagnosis"),
        v(diagnosis, "3. Diagnosed by: pediatrician / developmental pediatrician / neurologist / psychiatrist / psychologist"),
        v(diagnosis, "4. Diagnosis given: ASD / ADHD / global developmental delay / speech delay / intellectual disability / others"),
        v(diagnosis, "5. Severity level: mild / moderate / severe"),
        v(diagnosis, "6. Diagnostic tool used, if known: ADOS / CARS / DSM-5 / ISAA / M-CHAT / others"),
        v(diagnosis, "7. Childhood Autism Rating Scale (CARS) score, if available"),
        v(diagnosis, "8. Autism Diagnostic Observation Schedule (ADOS-2) score, if available"),
        v(diagnosis, "9. Indian Scale for Assessment of Autism (ISAA) score, if available"),
        v(diagnosis, "10. IQ / developmental quotient, if tested"),
        v(diagnosis, "11. Language level: non-verbal / single words / short phrases / fluent speech"),
        v(diagnosis, "12. Regression history: yes / no"),
        v(diagnosis, "13. Age of regression, if any"),
        v(diagnosis, "14. Skills lost during regression: speech / eye contact / social interaction / motor skills / others")
    ]
},
                {
                    name: "medical_history",
                    sql: `
                        INSERT INTO medical_history
                        (
                            child_id, mother_age_at_pregnancy, father_age_at_conception,
                            consanguineous_marriage, mode_of_conception, pregnancy_complications,
                            maternal_diabetes, maternal_hypertension, thyroid_disorder_during_pregnancy,
                            infection_during_pregnancy, medication_use_during_pregnancy,
                            antibiotic_use_during_pregnancy, fever_during_pregnancy,
                            toxin_or_chemical_exposure_during_pregnancy, delivery_type,
                            gestational_age_weeks, birth_weight_kg, nicu_admission,
                            birth_asphyxia_or_delayed_cry, neonatal_jaundice, seizures_after_birth,
                            breastfeeding_duration_months, formula_feeding_history,
                            weaning_age_months, vaccination_status, adverse_events_after_vaccination
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        v(medical, "1. Mother’s age at pregnancy"),
                        v(medical, "2. Father’s age at conception"),
                        v(medical, "3. Consanguineous marriage: yes / no"),
                        v(medical, "4. Mode of conception: natural / IVF / IUI / assisted reproduction"),
                        v(medical, "5. Pregnancy complications"),
                        v(medical, "6. Maternal diabetes"),
                        v(medical, "7. Maternal hypertension"),
                        v(medical, "8. Thyroid disorder during pregnancy"),
                        v(medical, "9. Infection during pregnancy"),
                        v(medical, "10. Medication use during pregnancy"),
                        v(medical, "11. Antibiotic use during pregnancy"),
                        v(medical, "12. Fever during pregnancy"),
                        v(medical, "13. Exposure to toxins / chemicals during pregnancy"),
                        v(medical, "14. Delivery type: normal / C-section / assisted delivery"),
                        v(medical, "15. Gestational age at birth"),
                        v(medical, "16. Birth weight"),
                        v(medical, "17. Neonatal Intensive Care Unit (NICU) admission history"),
                        v(medical, "18. Birth asphyxia / delayed cry"),
                        v(medical, "19. Neonatal jaundice"),
                        v(medical, "20. Seizures after birth"),
                        v(medical, "21. Breastfeeding duration"),
                        v(medical, "22. Formula feeding history"),
                        v(medical, "23. Weaning age"),
                        v(medical, "24. Vaccination status"),
                        v(medical, "25. Any adverse events after vaccination, as reported by parent")
                    ]
                },
                {
                    name: "milestones",
                    sql: `
                        INSERT INTO milestones
                        (
                            child_id, neck_holding_age_months, sitting_age_months, crawling_age_months,
                            standing_age_months, walking_age_months, first_words_age_months,
                            two_word_phrase_age_months, toilet_training_age_months,
                            fine_motor_development, gross_motor_development,
                            social_smile_age_months, response_to_name_age_months,
                            developmental_delay_noticed
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        v(milestones, "1. Neck holding age"),
                        v(milestones, "2. Sitting age"),
                        v(milestones, "3. Crawling age"),
                        v(milestones, "4. Standing age"),
                        v(milestones, "5. Walking age"),
                        v(milestones, "6. First words age"),
                        v(milestones, "7. Two-word phrase age"),
                        v(milestones, "8. Toilet training age"),
                        v(milestones, "9. Fine motor development"),
                        v(milestones, "10. Gross motor development"),
                        v(milestones, "11. Social smile age"),
                        v(milestones, "12. Response to name age"),
                        v(milestones, "13. Any developmental delay noticed")
                    ]
                }
            ];

            const runTask = (index) => {
                if (index >= tasks.length) {
                    return db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: commitErr.message })
                            );
                        }

                        res.json({
                            success: true,
                            message: "Full form saved successfully",
                            child_id
                        });
                    });
                }

                const task = tasks[index];
                db.query(task.sql, task.values, (err) => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({
                                success: false,
                                table: task.name,
                                error: err.sqlMessage || err.message
                            })
                        );
                    }
                    runTask(index + 1);
                });
            };

            runTask(0);
        });
    });
});

module.exports = router;