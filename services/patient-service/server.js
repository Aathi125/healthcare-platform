const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const patientRoutes = require("./routes/patientRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "patient-service",
    status: "running"
  });
});

app.use("/patients", patientRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Patient service connected to MongoDB");

    const PORT = process.env.PORT || 4004;
    app.listen(PORT, () => {
      console.log(`Patient service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start patient service:", error.message);
    process.exit(1);
  }
};

startServer();
