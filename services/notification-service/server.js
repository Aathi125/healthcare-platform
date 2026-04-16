const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "notification-service",
    status: "running"
  });
});

app.use("/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
