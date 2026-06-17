const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// serve frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

// homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// existing routes
app.use("/api/consent", require("./routes/consent.routes"));
app.use("/api/demographics", require("./routes/demographics.routes"));
app.use("/api/diagnosis", require("./routes/diagnosis.routes"));
app.use("/api/environment", require("./routes/environment.routes"));
app.use("/api/medical", require("./routes/medical.routes"));
app.use("/api/medications", require("./routes/medications.routes"));
app.use("/api/lab", require("./routes/lab.routes"));
app.use("/api/uploads", require("./routes/uploads.routes"));
app.use("/api/save-form", require("./routes/saveForm.routes"));
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});