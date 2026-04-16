const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const appointmentRoutes = require("./routes/appointmentRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "appointment-service",
    status: "running"
  });
});

app.use("/appointments", appointmentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Appointment service connected to MongoDB");

    const PORT = process.env.PORT || 4003;
    app.listen(PORT, () => {
      console.log(`Appointment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start appointment service:", error.message);
    process.exit(1);
  }
};

startServer();
