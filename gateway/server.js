const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");

dotenv.config();

const app = express();

app.use(cors());
app.use(morgan("dev"));

const stripTrailingSlash = (url) => url.replace(/\/+$/, "");
const authTarget = `${stripTrailingSlash(process.env.AUTH_SERVICE_URL || "http://auth-service:4001")}/auth`;
const doctorTarget = `${stripTrailingSlash(process.env.DOCTOR_SERVICE_URL || "http://doctor-service:4002")}/doctors`;
const appointmentTarget = `${stripTrailingSlash(process.env.APPOINTMENT_SERVICE_URL || "http://appointment-service:4003")}/appointments`;
const patientTarget = `${stripTrailingSlash(process.env.PATIENT_SERVICE_URL || "http://patient-service:4004")}/patients`;
const paymentTarget = `${stripTrailingSlash(process.env.PAYMENT_SERVICE_URL || "http://payment-service:4005")}/payments`;
const notificationTarget = `${stripTrailingSlash(process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4006")}/notifications`;

app.get("/", (req, res) => {
  res.status(200).json({
    service: "api-gateway",
    status: "running",
    routes: {
      auth: "/auth",
      doctors: "/doctors",
      appointments: "/appointments",
      patients: "/patients",
      payments: "/payments",
      notifications: "/notifications"
    }
  });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: authTarget,
    changeOrigin: true,
    proxyTimeout: 5000,
    onError: (err, req, res) => {
      res.status(502).json({
        message: "Auth service is unavailable",
        error: err.message
      });
    }
  })
);

app.use(
  "/doctors",
  createProxyMiddleware({
    target: doctorTarget,
    changeOrigin: true,
    proxyTimeout: 5000,
    onError: (err, req, res) => {
      res.status(502).json({
        message: "Doctor service is unavailable",
        error: err.message
      });
    }
  })
);

app.use(
  "/appointments",
  createProxyMiddleware({
    target: appointmentTarget,
    changeOrigin: true,
    proxyTimeout: 5000,
    onError: (err, req, res) => {
      res.status(502).json({
        message: "Appointment service is unavailable",
        error: err.message
      });
    }
  })
);

app.use(
  "/patients",
  createProxyMiddleware({
    target: patientTarget,
    changeOrigin: true,
    proxyTimeout: 15000,
    onError: (err, req, res) => {
      res.status(502).json({
        message: "Patient service is unavailable",
        error: err.message
      });
    }
  })
);

app.use(
  "/payments",
  createProxyMiddleware({
    target: paymentTarget,
    changeOrigin: true,
    proxyTimeout: 5000,
    onError: (err, req, res) => {
      res.status(502).json({
        message: "Payment service is unavailable",
        error: err.message
      });
    }
  })
);

app.use(
  "/notifications",
  createProxyMiddleware({
    target: notificationTarget,
    changeOrigin: true,
    proxyTimeout: 5000,
    onError: (err, req, res) => {
      res.status(502).json({
        message: "Notification service is unavailable",
        error: err.message
      });
    }
  })
);

app.use((req, res) => {
  res.status(404).json({ message: "Gateway route not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
