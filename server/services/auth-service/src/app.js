const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const isProd = process.env.NODE_ENV === "production";
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

app.use(helmet());
app.use(
  cors({
    origin: isProd ? configuredOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

app.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", service: "auth-service" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

module.exports = app;
