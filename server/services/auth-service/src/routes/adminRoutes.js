const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticateJwtWithUserCheck, requireRole } = require("../middleware/authMiddleware");
const { Role } = require("../models/User");

const router = express.Router();

router.use(authenticateJwtWithUserCheck, requireRole(Role.ADMIN));

router.patch("/verify-doctor/:id", adminController.verifyDoctor);
router.get("/audit-logs", adminController.listAuditLogs);
router.get("/users", adminController.listUsers);
router.post("/users/:id/revoke-sessions", adminController.revokeSessions);

module.exports = router;
