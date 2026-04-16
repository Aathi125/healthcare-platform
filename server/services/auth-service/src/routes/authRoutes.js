const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { authenticateJwtWithUserCheck } = require("../middleware/authMiddleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/oauth/register/patient", authLimiter, authController.oauthRegisterPatient);
router.post("/oauth/register/doctor", authLimiter, authController.oauthRegisterDoctor);
router.post("/oauth/refresh", authLimiter, authController.oauthRefresh);
router.post("/oauth/logout", authenticateJwtWithUserCheck, authController.oauthLogout);
router.get("/me", authenticateJwtWithUserCheck, authController.me);

module.exports = router;
