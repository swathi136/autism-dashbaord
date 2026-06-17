const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
    const data = req.body;

    const sql = `
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
            restricted_interests
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        data.child_id,
        data.eye_contact,
        data.response_to_name,
        data.social_smile,
        data.joint_attention,
        data.interest_in_peers,
        data.pretend_play,
        data.repetitive_movements,
        data.spinning_or_lining_objects,
        data.hand_flapping,
        data.toe_walking,
        data.restricted_interests
    ], (err, result) => {
        if (err) return res.send(err);
        res.send({ message: "Saved", result });
    });
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM core_symptoms", (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    });
});

module.exports = router;