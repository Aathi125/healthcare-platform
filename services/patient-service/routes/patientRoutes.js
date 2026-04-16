const express = require("express");
const {
  getMyProfile,
  updateMyProfile,
  uploadMyReport,
  getMyReports,
  getReportsByPatientId,
  downloadReport,
  issuePrescription,
  getMyPrescriptions,
  getDoctorPrescriptions
} = require("../controllers/patientController");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/me/profile", authenticate, authorize("PATIENT"), getMyProfile);
router.put("/me/profile", authenticate, authorize("PATIENT"), updateMyProfile);

router.post("/me/reports", authenticate, authorize("PATIENT"), upload.single("file"), uploadMyReport);
router.get("/me/reports", authenticate, authorize("PATIENT"), getMyReports);
router.get("/:patientId/reports", authenticate, authorize("DOCTOR", "ADMIN"), getReportsByPatientId);
router.get("/reports/:reportId/download", authenticate, authorize("PATIENT", "DOCTOR", "ADMIN"), downloadReport);

router.post("/doctor/prescriptions", authenticate, authorize("DOCTOR"), issuePrescription);
router.get("/doctor/prescriptions", authenticate, authorize("DOCTOR"), getDoctorPrescriptions);
router.get("/me/prescriptions", authenticate, authorize("PATIENT"), getMyPrescriptions);

module.exports = router;
