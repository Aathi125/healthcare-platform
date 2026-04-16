const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const paymentRoutes = require("./routes/paymentRoutes");
const { handleStripeWebhook } = require("./controllers/paymentController");

dotenv.config();

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.post("/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    service: "payment-service",
    status: "running"
  });
});

app.use("/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Payment service connected to MongoDB");

    const PORT = process.env.PORT || 4005;
    app.listen(PORT, () => {
      console.log(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start payment service:", error.message);
    process.exit(1);
  }
};

startServer();
