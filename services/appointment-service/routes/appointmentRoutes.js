const express = require("express");
const {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getMyAppointmentById,
  updateMyAppointment,
  cancelMyAppointment,
  getDoctorAppointments,
  getDoctorAppointmentById,
  acceptAppointment,
  rejectAppointment,
  completeAppointment
} = require("../controllers/appointmentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/available-slots", authenticate, authorize("PATIENT"), getAvailableSlots);
router.post("/", authenticate, authorize("PATIENT"), bookAppointment);
router.get("/my", authenticate, authorize("PATIENT"), getMyAppointments);
router.get("/my/:id", authenticate, authorize("PATIENT"), getMyAppointmentById);
router.put("/my/:id", authenticate, authorize("PATIENT"), updateMyAppointment);
router.patch("/my/:id/cancel", authenticate, authorize("PATIENT"), cancelMyAppointment);

router.get("/doctor", authenticate, authorize("DOCTOR"), getDoctorAppointments);
router.get("/doctor/:id", authenticate, authorize("DOCTOR"), getDoctorAppointmentById);
router.patch("/doctor/:id/accept", authenticate, authorize("DOCTOR"), acceptAppointment);
router.patch("/doctor/:id/reject", authenticate, authorize("DOCTOR"), rejectAppointment);
router.patch("/doctor/:id/complete", authenticate, authorize("DOCTOR"), completeAppointment);

module.exports = router;
