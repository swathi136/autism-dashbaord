const express = require("express");
const router = express.Router();
const db = require("../db");

function mapEyeContact(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return "Normal";
    if (raw === "mild" || raw === "moderate") return "Reduced";
    if (raw === "severe") return "Absent";
    return null;
}

function mapResponseToName(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return "Normal";
    if (raw === "mild") return "Occasional";
    if (raw === "moderate") return "Rare";
    if (raw === "severe") return "Absent";
    return null;
}

function mapPresentReducedAbsent(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return "Present";
    if (raw === "mild" || raw === "moderate") return "Reduced";
    if (raw === "severe") return "Absent";
    return null;
}

function mapInterestInPeers(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return "Normal";
    if (raw === "mild" || raw === "moderate") return "Low";
    if (raw === "severe") return "Absent";
    return null;
}

function mapPretendPlay(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return "Present";
    if (raw === "mild" || raw === "moderate") return "Limited";
    if (raw === "severe") return "Absent";
    return null;
}

function mapBooleanFromSeverity(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return 0;
    if (raw === "mild" || raw === "moderate" || raw === "severe") return 1;
    return null;
}

function mapNoneMildModerateSevere(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return "None";
    if (raw === "mild") return "Mild";
    if (raw === "moderate") return "Moderate";
    if (raw === "severe") return "Severe";
    return null;
}

function mapAttentionSpan(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "typical") return "Normal";
    if (raw === "mild") return "Reduced";
    if (raw === "moderate" || raw === "severe") return "Very Low";
    return null;
}

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
    const symptoms = sections.symptoms || {};
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
                    name: "core_symptoms",
                    sql: `
                        INSERT INTO core_symptoms (
                            child_id,
                            eye_contact,
                            response_to_name,
                            social_smile,
                            joint_attention,
                            interest_in_peers,
                            pretend_play,
                            repetitive_movements,
                            spinning_or_lining_objects,
                            hand_flapping,
                            toe_walking,
                            restricted_interests,
                            sensory_sensitivity_sound,
                            sensory_sensitivity_light,
                            sensory_sensitivity_touch,
                            sensory_sensitivity_food,
                            hyperactivity,
                            attention_span,
                            aggression,
                            self_injury,
                            anxiety,
                            meltdowns,
                            sleep_disturbance,
                            communication_difficulty,
                            social_interaction_difficulty,
                            daily_living_skill_difficulty
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        mapEyeContact(v(symptoms, "1. Eye contact")),
                        mapResponseToName(v(symptoms, "2. Response to name")),
                        mapPresentReducedAbsent(v(symptoms, "3. Social smile")),
                        mapPresentReducedAbsent(v(symptoms, "4. Joint attention")),
                        mapInterestInPeers(v(symptoms, "5. Interest in peers")),
                        mapPretendPlay(v(symptoms, "6. Pretend play")),
                        mapBooleanFromSeverity(v(symptoms, "7. Repetitive movements")),
                        mapBooleanFromSeverity(v(symptoms, "8. Spinning / lining up objects")),
                        mapBooleanFromSeverity(v(symptoms, "9. Hand flapping")),
                        mapBooleanFromSeverity(v(symptoms, "10. Toe walking")),
                        mapBooleanFromSeverity(v(symptoms, "11. Restricted interests")),
                        mapNoneMildModerateSevere(v(symptoms, "12. Sensory sensitivity to sound")),
                        mapNoneMildModerateSevere(v(symptoms, "13. Sensory sensitivity to light")),
                        mapNoneMildModerateSevere(v(symptoms, "14. Sensory sensitivity to touch")),
                        mapNoneMildModerateSevere(v(symptoms, "15. Sensory sensitivity to food texture")),
                        mapNoneMildModerateSevere(v(symptoms, "16. Hyperactivity")),
                        mapAttentionSpan(v(symptoms, "17. Attention span")),
                        mapBooleanFromSeverity(v(symptoms, "18. Aggression")),
                        mapBooleanFromSeverity(v(symptoms, "19. Self-injury")),
                        mapNoneMildModerateSevere(v(symptoms, "20. Anxiety")),
                        mapBooleanFromSeverity(v(symptoms, "21. Meltdowns")),
                        mapBooleanFromSeverity(v(symptoms, "22. Sleep disturbance")),
                        mapNoneMildModerateSevere(v(symptoms, "23. Communication difficulty")),
                        mapNoneMildModerateSevere(v(symptoms, "24. Social interaction difficulty")),
                        mapNoneMildModerateSevere(v(symptoms, "25. Daily living skill difficulty"))
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
                        ["yes", "1", "true"].includes(
                            String(v(medical, "3. Consanguineous marriage: yes / no") || "").trim().toLowerCase()
                        ) ? 1 : 0,
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
                },
                {
                    name: "family_history",
                    sql: `
                        INSERT INTO family_history
                        (
                            child_id,
                            family_history_asd,
                            family_history_adhd,
                            family_history_speech_delay,
                            family_history_epilepsy,
                            family_history_intellectual_disability,
                            family_history_psychiatric_illness,
                            family_history_autoimmune_disease,
                            family_history_allergies,
                            family_history_metabolic_disorders,
                            family_history_gastrointestinal_disorders,
                            sibling_developmental_history,
                            sibling_with_asd_or_neurodevelopmental_condition
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        ["yes", "1", "true"].includes(String(v(family, "1. Family history of autism spectrum disorder (ASD)") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "2. Family history of Attention-Deficit/Hyperactivity Disorder (ADHD)") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "3. Family history of speech delay") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "4. Family history of epilepsy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "5. Family history of intellectual disability") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "6. Family history of psychiatric illness") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "7. Family history of autoimmune disease") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "8. Family history of allergies") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "9. Family history of metabolic disorders") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(family, "10. Family history of gastrointestinal disorders") || "").trim().toLowerCase()) ? 1 : 0,
                        v(family, "11. Sibling developmental history"),
                        ["yes", "1", "true"].includes(String(v(family, "12. Any sibling with ASD or neurodevelopmental condition") || "").trim().toLowerCase()) ? 1 : 0
                    ]
                },
                {
                    name: "food_habits",
                    sql: `
                        INSERT INTO food_habits
                        (
                            child_id,
                            diet_type,
                            regular_diet_pattern,
                            food_selectivity,
                            picky_eating,
                            food_texture_preference,
                            avoided_foods,
                            preferred_foods,
                            appetite,
                            food_cravings,
                            water_intake_liters,
                            constipation_related_diet_pattern,
                            special_diet_type,
                            special_diet_duration_months,
                            response_to_special_diet
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        (() => {
                            const raw = String(v(food, "1. Vegetarian / non-vegetarian / vegan") || "").trim().toLowerCase();
                            if (raw === "vegetarian") return "Vegetarian";
                            if (raw === "non-vegetarian" || raw === "non vegetarian" || raw === "non_vegetarian") return "Non-Vegetarian";
                            if (raw === "vegan") return "Vegan";
                            return null;
                        })(),
                        v(food, "2. Regular diet pattern"),
                        v(food, "3. Food selectivity: mild / moderate / severe"),
                        ["yes", "1", "true"].includes(String(v(food, "4. Picky eating") || "").trim().toLowerCase()) ? 1 : 0,
                        v(food, "5. Food texture preference"),
                        v(food, "6. Avoided foods"),
                        v(food, "7. Preferred foods"),
                        v(food, "8. Appetite: poor / normal / excessive"),
                        v(food, "9. Food cravings"),
                        v(food, "10. Water intake"),
                        v(food, "11. Constipation-related diet pattern"),
                        v(food, "12. Use of special diet: gluten-free / casein-free / ketogenic / low sugar / others"),
                        v(food, "13. Duration of special diet"),
                        v(food, "14. Response to special diet")
                    ]
                },
                {
                    name: "gi_and_metabolic_history",
                    sql: `
                        INSERT INTO gi_and_metabolic_history
                        (
                            child_id,
                            constipation,
                            diarrhea,
                            bloating,
                            abdominal_pain,
                            acid_reflux,
                            vomiting_tendency,
                            undigested_food_in_stool,
                            food_intolerance,
                            food_allergy,
                            stool_frequency_per_day,
                            stool_consistency,
                            gut_infection_history,
                            worm_infestation_history,
                            probiotic_use,
                            antibiotic_use_last_6_months,
                            recurrent_infections,
                            frequent_fever,
                            skin_allergy_or_eczema,
                            asthma_or_wheezing,
                            unusual_body_odour
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        ["yes", "1", "true", "occasional"].includes(String(v(gi, "1. Constipation") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(gi, "2. Diarrhea") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(gi, "3. Bloating") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(gi, "4. Abdominal pain") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(gi, "5. Acid reflux") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(gi, "6. Vomiting tendency") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(gi, "7. Undigested food in stool") || "").trim().toLowerCase()) ? 1 : 0,
                        v(gi, "8. Food intolerance"),
                        v(gi, "9. Food allergy"),
                        v(gi, "10. Stool frequency"),
                        v(gi, "11. Stool consistency"),
                        v(gi, "12. Gut infection history"),
                        v(gi, "13. Worm infestation history"),
                        v(gi, "14. Probiotic use"),
                        v(gi, "15. Antibiotic use in the past 6 months"),
                        v(gi, "16. Recurrent infections"),
                        v(gi, "17. Frequent fever"),
                        v(gi, "18. Skin allergy / eczema"),
                        v(gi, "19. Asthma / wheezing"),
                        v(gi, "20. Unusual body odour / urine odour")
                    ]
                },
                {
                    name: "sleep_and_behaviour",
                    sql: `
                        INSERT INTO sleep_and_behaviour
                        (
                            child_id,
                            sleep_onset_difficulty,
                            frequent_night_waking,
                            early_morning_waking,
                            total_sleep_duration_hours,
                            daytime_sleepiness,
                            snoring,
                            bruxism,
                            restlessness_during_sleep,
                            behaviour_worsening_with_poor_sleep,
                            aggression_frequency,
                            self_injury_frequency,
                            tantrum_frequency,
                            tantrum_triggers,
                            calming_strategies
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        ["yes", "1", "true", "occasional"].includes(String(v(sleep, "1. Sleep onset difficulty") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(sleep, "2. Frequent night waking") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(sleep, "3. Early morning waking") || "").trim().toLowerCase()) ? 1 : 0,
                        v(sleep, "4. Total sleep duration"),
                        ["yes", "1", "true", "occasional"].includes(String(v(sleep, "5. Daytime sleepiness") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(sleep, "6. Snoring") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(sleep, "7. Bruxism / teeth grinding") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true", "occasional"].includes(String(v(sleep, "8. Restlessness during sleep") || "").trim().toLowerCase()) ? 1 : 0,
                        v(sleep, "9. Behaviour worsening with poor sleep"),
                        v(sleep, "10. Aggression frequency"),
                        v(sleep, "11. Self-injury frequency"),
                        v(sleep, "12. Tantrum frequency"),
                        v(sleep, "13. Triggers for tantrums"),
                        v(sleep, "14. Calming strategies")
                    ]
                },
                {
                    name: "treatments",
                    sql: `
                        INSERT INTO treatments
                        (
                            child_id,
                            speech_therapy,
                            occupational_therapy,
                            behaviour_therapy_aba,
                            special_education,
                            sensory_integration_therapy,
                            physiotherapy,
                            cognitive_therapy,
                            parent_training_program,
                            social_skills_training,
                            music_therapy,
                            yoga_therapy,
                            ayurveda_siddha_homeopathy_naturopathy,
                            biomedical_interventions,
                            dietary_intervention,
                            supplements,
                            medication,
                            frequency_of_therapy_per_week,
                            duration_of_current_therapy_months,
                            parent_perceived_improvement,
                            areas_improved,
                            areas_not_improved
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "1. Speech therapy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "2. Occupational therapy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "3. Behaviour therapy / ABA") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "4. Special education") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "5. Sensory integration therapy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "6. Physiotherapy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "7. Cognitive therapy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "8. Parent training program") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "9. Social skills training") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "10. Music therapy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "11. Yoga therapy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "12. Ayurveda / Siddha / homeopathy / naturopathy") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "13. Biomedical interventions") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "14. Dietary intervention") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "15. Supplements") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "past", "previously", "1", "true"].includes(String(v(treatments, "16. Medication") || "").trim().toLowerCase()) ? 1 : 0,
                        v(treatments, "17. Frequency of therapy per week"),
                        v(treatments, "18. Duration of current therapy"),
                        v(treatments, "19. Parent-perceived improvement"),
                        v(treatments, "20. Areas improved"),
                        v(treatments, "21. Areas not improved")
                    ]
                },
                {
                    name: "treatment_history",
                    sql: `
                        INSERT INTO treatment_history
                        (
                            child_id,
                            previous_therapies_tried,
                            age_when_therapy_started_months,
                            duration_of_each_therapy_months,
                            reason_for_stopping_therapy,
                            previous_medications,
                            previous_supplements,
                            previous_special_diets,
                            previous_hospitalizations,
                            previous_neurological_evaluation,
                            previous_genetic_testing,
                            previous_metabolic_testing,
                            previous_eeg,
                            previous_mri_ct,
                            gut_microbiome_test_performed,
                            amino_acid_profile_test_performed
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        v(history, "1. Previous therapies tried"),
                        v(history, "2. Age when therapy started"),
                        v(history, "3. Duration of each therapy"),
                        v(history, "4. Reason for stopping therapy"),
                        v(history, "5. Previous medications"),
                        v(history, "6. Previous supplements"),
                        v(history, "7. Previous special diets"),
                        v(history, "8. Previous hospitalizations"),
                        ["yes", "1", "true"].includes(String(v(history, "9. Previous neurological evaluation") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(history, "10. Previous genetic testing") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(history, "11. Previous metabolic testing") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(history, "12. Previous EEG") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(history, "13. Previous MRI / CT") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(history, "14. Previous gut microbiome test (Whether performed or not)") || "").trim().toLowerCase()) ? 1 : 0,
                        ["yes", "1", "true"].includes(String(v(history, "15. Previous amino acid profile test (Whether performed or not)") || "").trim().toLowerCase()) ? 1 : 0
                    ]
                },
                {
                    name: "medications",
                    sql: `
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
                    `,
                    values: [
                        child_id,
                        v(medications, "1. Current prescription medicines"),
                        v(medications, "2. Dose and duration"),
                        v(medications, "3. Antiepileptic drugs"),
                        v(medications, "4. Antipsychotic drugs"),
                        v(medications, "5. ADHD medications"),
                        v(medications, "6. Sleep medicines"),
                        v(medications, "7. Antianxiety medicines"),
                        v(medications, "8. Digestive medicines"),
                        v(medications, "9. Laxatives"),
                        v(medications, "10. Antibiotics"),
                        v(medications, "11. Probiotics"),
                        v(medications, "12. Multivitamins"),
                        v(medications, "13. Vitamin B12"),
                        v(medications, "14. Vitamin D"),
                        v(medications, "15. Omega-3"),
                        v(medications, "16. Magnesium"),
                        v(medications, "17. Zinc"),
                        v(medications, "18. Iron"),
                        v(medications, "19. Folate"),
                        v(medications, "20. Amino acid supplements"),
                        v(medications, "21. Any adverse reaction to medicine or supplement")
                    ]
                },
                {
                    name: "lab_data",
                    sql: `
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
                    `,
                    values: [
                        child_id,
                        v(lab, "1. CBC Details"),
                        v(lab, "2. Hemoglobin"),
                        v(lab, "3. Ferritin"),
                        v(lab, "4. Vitamin B12"),
                        v(lab, "5. Vitamin D"),
                        v(lab, "6. Folate"),
                        v(lab, "7. Thyroid profile"),
                        v(lab, "8. Liver Function Test"),
                        v(lab, "9. Kidney Function Test"),
                        v(lab, "10. Blood glucose"),
                        v(lab, "11. HbA1c"),
                        v(lab, "12. CRP / inflammation markers"),
                        v(lab, "13. Lactate"),
                        v(lab, "14. Ammonia"),
                        v(lab, "15. Homocysteine"),
                        v(lab, "16. Stool test details"),
                        v(lab, "17. Allergy test results"),
                        v(lab, "18. Genetic test, if available")
                    ]
                },
                {
                    name: "amino_acid_profile",
                    sql: `
                        INSERT INTO amino_acid_profile
                        (
                            child_id,
                            sample_collection_date,
                            methyl_histidine_1,
                            methyl_histidine_3,
                            alpha_aminoadipic_acid,
                            alpha_aminobutyric_acid,
                            alanine,
                            anserine,
                            arginine,
                            argininosuccinic_acid,
                            asparagine,
                            aspartic_acid,
                            beta_aminoisobutyric_acid,
                            beta_alanine,
                            carnosine,
                            citrulline,
                            cystathionine,
                            cystine,
                            ethanolamine,
                            gamma_aminobutyric_acid,
                            glutamine,
                            glutamic_acid,
                            glycine,
                            homocitrulline,
                            homocystine,
                            histidine,
                            hydroxylysine,
                            hydroxyproline,
                            isoleucine,
                            leucine,
                            lysine,
                            methionine,
                            methionine_sulfoxide,
                            norleucine,
                            norvaline,
                            ornithine,
                            phosphoethanolamine,
                            phenylalanine,
                            proline,
                            phosphoserine,
                            sarcosine,
                            serine,
                            taurine,
                            threonine,
                            tryptophan,
                            tyrosine,
                            valine,
                            repeat_test_date
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    values: [
                        child_id,
                        v(amino, "Date of sample collection"),
                        v(amino, "1-Methyl-histidine"),
                        v(amino, "3-Methyl-histidine"),
                        v(amino, "Alpha aminoadipic acid"),
                        v(amino, "Alpha amino butyric acid"),
                        v(amino, "Alanine"),
                        v(amino, "Anserine"),
                        v(amino, "Arginine"),
                        v(amino, "Argininosuccinic acid"),
                        v(amino, "Asparagine"),
                        v(amino, "Aspartic acid"),
                        v(amino, "Beta-amino-isobutyric acid"),
                        v(amino, "Beta-alanine"),
                        v(amino, "Carnosine"),
                        v(amino, "Citrulline"),
                        v(amino, "Cystathionine"),
                        v(amino, "Cystine"),
                        v(amino, "Ethanolamine"),
                        v(amino, "Gamma amino isobutyric acid"),
                        v(amino, "Glutamine"),
                        v(amino, "Glutamic acid"),
                        v(amino, "Glycine"),
                        v(amino, "Homocitrulline"),
                        v(amino, "Homocystine"),
                        v(amino, "Histidine"),
                        v(amino, "Hydroxylysine"),
                        v(amino, "Hydroxyproline"),
                        v(amino, "Isoleucine"),
                        v(amino, "Leucine"),
                        v(amino, "Lysine"),
                        v(amino, "Methionine"),
                        v(amino, "Methionine sulfoxide"),
                        v(amino, "Norleucine"),
                        v(amino, "Norvaline"),
                        v(amino, "Ornithine"),
                        v(amino, "Phosphoethanolamine"),
                        v(amino, "Phenylalanine"),
                        v(amino, "Proline"),
                        v(amino, "Phosphoserine"),
                        v(amino, "Sarcosine"),
                        v(amino, "Serine"),
                        v(amino, "Taurine"),
                        v(amino, "Threonine"),
                        v(amino, "Tryptophan"),
                        v(amino, "Tyrosine"),
                        v(amino, "Valine"),
                        v(amino, "Repeat test date, if applicable")
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
