const express = require("express");
const { proxyClinicianPatientSearch } = require("../controllers/directoryProxyController");
const { authenticateRequest, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.options("/patients/search", (_req, res) => {
  res.sendStatus(204);
});

router.get(
  "/patients/search",
  authenticateRequest,
  authorizeRoles("doctor", "admin"),
  proxyClinicianPatientSearch
);

module.exports = router;
