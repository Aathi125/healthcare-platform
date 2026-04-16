const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan("dev"));

const gatewayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.GATEWAY_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(gatewayLimiter);

const routeMap = [
  { prefix: "/api/auth", envKey: "AUTH_SERVICE_URL", defaultUrl: "http://localhost:8081" },
  { prefix: "/api/doctors", envKey: "DOCTOR_SERVICE_URL", defaultUrl: "http://localhost:5002" },
  { prefix: "/api/appointments", envKey: "APPOINTMENT_SERVICE_URL", defaultUrl: "http://localhost:5003" },
  { prefix: "/api/patients", envKey: "PATIENT_SERVICE_URL", defaultUrl: "http://localhost:8084" },
  { prefix: "/api/v1/patient", envKey: "PATIENT_SERVICE_URL", defaultUrl: "http://localhost:8084" },
  { prefix: "/api/patient", envKey: "PATIENT_SERVICE_URL", defaultUrl: "http://localhost:8084" },
  { prefix: "/api/payments", envKey: "PAYMENT_SERVICE_URL", defaultUrl: "http://localhost:8085" },
  { prefix: "/api/notifications", envKey: "NOTIFICATION_SERVICE_URL", defaultUrl: "http://localhost:8086" },
  { prefix: "/api/telemedicine", envKey: "TELEMEDICINE_SERVICE_URL", defaultUrl: "http://localhost:4007" },
  { prefix: "/api/ai", envKey: "AI_SYMPTOM_SERVICE_URL", defaultUrl: "http://localhost:8088" },
];

function getTargetUrl(envKey, defaultUrl) {
  const value = process.env[envKey];
  if (!value || !value.trim()) return defaultUrl;
  return value.trim();
}

function buildProxy(prefix, target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: Number(process.env.PROXY_TIMEOUT_MS) || 15000,
    timeout: Number(process.env.PROXY_TIMEOUT_MS) || 15000,
    on: {
      error(err, req, res) {
        return res.status(502).json({
          success: false,
          error: {
            code: "UPSTREAM_UNAVAILABLE",
            message: `Failed to reach upstream service for ${prefix}`,
            details: err?.message || "Unknown proxy error",
          },
        });
      },
    },
  });
}

const resolvedRoutes = routeMap.map((r) => ({
  ...r,
  target: getTargetUrl(r.envKey, r.defaultUrl),
}));

for (const route of resolvedRoutes) {
  app.use(route.prefix, buildProxy(route.prefix, route.target));
}

app.get("/health", (_req, res) => {
  return res.json({
    success: true,
    data: {
      status: "ok",
      service: "api-gateway",
      routes: resolvedRoutes.map((r) => ({ prefix: r.prefix, target: r.target })),
    },
  });
});

app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

module.exports = app;
