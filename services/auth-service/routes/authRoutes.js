const express = require("express");
const {
  registerPatient,
  loginUser,
  getMe,
  getDoctorAccounts,
  createDoctorAccount,
  createAdminAccount
} = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerPatient);
router.post("/login", loginUser);
router.get("/me", authenticate, getMe);
router.get("/doctor-accounts", authenticate, authorize("ADMIN"), getDoctorAccounts);
router.post("/create-doctor", authenticate, authorize("ADMIN"), createDoctorAccount);

// Simple helper route to seed an admin account.
// In production, create admin users through a safer internal process.
router.post("/create-admin", createAdminAccount);

module.exports = router;
