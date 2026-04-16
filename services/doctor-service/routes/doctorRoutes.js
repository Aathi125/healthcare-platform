const express = require("express");
const {
  getDoctors,
  getDoctorById,
  createDoctorProfile,
  getMyProfile,
  updateMyProfile,
  updateMyAvailability,
  verifyDoctor
} = require("../controllers/doctorController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getDoctors);
router.get("/me/profile", authenticate, authorize("DOCTOR"), getMyProfile);
router.put("/me/profile", authenticate, authorize("DOCTOR"), updateMyProfile);
router.post("/me/availability", authenticate, authorize("DOCTOR"), updateMyAvailability);
router.post("/", authenticate, authorize("ADMIN"), createDoctorProfile);
router.patch("/:id/verify", authenticate, authorize("ADMIN"), verifyDoctor);
router.get("/:id", getDoctorById);

module.exports = router;
