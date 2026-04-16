const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const consultAuxRoutes = require("./routes/consultAuxRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const videoRoutes = require("./routes/videoRoutes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  })
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "telemedicine-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/consult", consultAuxRoutes);
app.use("/api/v1/video", videoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
