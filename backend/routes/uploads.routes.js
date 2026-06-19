const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../db");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const fields = upload.fields([
    { name: "autism_diagnosis_report", maxCount: 1 },
    { name: "previous_lab_reports", maxCount: 1 },
    { name: "amino_acid_profile_report", maxCount: 1 },
    { name: "prescription_copy", maxCount: 1 },
    { name: "therapy_assessment_report", maxCount: 1 },
    { name: "developmental_assessment_report", maxCount: 1 },
    { name: "diet_chart", maxCount: 1 },
    { name: "stool_gut_test_report", maxCount: 1 },
    { name: "genetic_test_report", maxCount: 1 },
    { name: "parent_observation_notes_file", maxCount: 1 }
]);

router.post("/", fields, (req, res) => {
    const child_id = req.body.child_id;

    const getFilePath = (fieldName) => {
        return req.files && req.files[fieldName] ? req.files[fieldName][0].path : null;
    };

    const sql = `
        INSERT INTO uploads (
            child_id,
            autism_diagnosis_report,
            previous_lab_reports,
            amino_acid_profile_report,
            prescription_copy,
            therapy_assessment_report,
            developmental_assessment_report,
            diet_chart,
            stool_gut_test_report,
            genetic_test_report,
            parent_observation_notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        child_id,
        getFilePath("autism_diagnosis_report"),
        getFilePath("previous_lab_reports"),
        getFilePath("amino_acid_profile_report"),
        getFilePath("prescription_copy"),
        getFilePath("therapy_assessment_report"),
        getFilePath("developmental_assessment_report"),
        getFilePath("diet_chart"),
        getFilePath("stool_gut_test_report"),
        getFilePath("genetic_test_report"),
        req.body.parent_observation_notes || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.sqlMessage || err.message
            });
        }

        res.json({
            success: true,
            message: "Files uploaded and saved",
            result
        });
    });
});

module.exports = router;