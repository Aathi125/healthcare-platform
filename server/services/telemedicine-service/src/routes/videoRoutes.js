const express = require("express");

const {
  createVideoSession,
  endVideoSession,
  getInviteInfo,
  getVideoSession,
  joinVideoSession,
} = require("../controllers/videoController");
const { proxyClinicianPatientSearch } = require("../controllers/directoryProxyController");
const { authenticateRequest, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/invite/:code", getInviteInfo);

router.use(authenticateRequest);

/** @deprecated Prefer GET /api/v1/consult/patients/search */
router.get(
  "/clinician/patients/search",
  authorizeRoles("doctor", "admin"),
  proxyClinicianPatientSearch
);

router.post("/sessions", authorizeRoles("doctor", "admin"), createVideoSession);
router.get("/sessions/:sessionId", authorizeRoles("doctor", "patient", "admin"), getVideoSession);
router.post(
  "/sessions/:sessionId/join",
  authorizeRoles("doctor", "patient", "admin"),
  joinVideoSession
);
router.post("/sessions/:sessionId/end", authorizeRoles("doctor", "admin"), endVideoSession);

module.exports = router;
