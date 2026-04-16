const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const doctorRoutes = require("./routes/doctorRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "doctor-service",
    status: "running"
  });
});

app.use("/doctors", doctorRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Doctor service connected to MongoDB");

    const PORT = process.env.PORT || 4002;
    app.listen(PORT, () => {
      console.log(`Doctor service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start doctor service:", error.message);
    process.exit(1);
  }
};

startServer();
