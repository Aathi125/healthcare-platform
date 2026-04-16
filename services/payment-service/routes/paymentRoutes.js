const express = require("express");
const {
  createCheckoutSession,
  getCheckoutSessionStatus,
  payForAppointment,
  getMyPayments,
  getAllPayments,
  getPaymentByAppointment
} = require("../controllers/paymentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/checkout-session", authenticate, authorize("PATIENT"), createCheckoutSession);
router.get("/checkout-session/:sessionId", authenticate, authorize("PATIENT"), getCheckoutSessionStatus);
router.post("/pay", authenticate, authorize("PATIENT"), payForAppointment);
router.get("/my", authenticate, authorize("PATIENT"), getMyPayments);
router.get("/", authenticate, authorize("ADMIN"), getAllPayments);
router.get("/appointment/:appointmentId", authenticate, authorize("PATIENT", "DOCTOR", "ADMIN"), getPaymentByAppointment);

module.exports = router;
