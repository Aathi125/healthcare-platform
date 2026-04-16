const { z } = require("zod");
const { User, Role, DoctorVerificationStatus } = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { writeAudit } = require("../utils/audit");
const { logoutKeycloakUserSessionsByEmail } = require("../utils/keycloakAdmin");

const verifyDoctorParams = z.object({
  id: z.string().min(1),
});

const listUsersQuery = z.object({
  role: z.enum([Role.PATIENT, Role.DOCTOR, Role.ADMIN]).optional(),
  // Back-compat with suggested API: ?status=PENDING_VERIFICATION
  // Also accepts ?doctorVerificationStatus=...
  status: z.enum(Object.values(DoctorVerificationStatus)).optional(),
  doctorVerificationStatus: z.enum(Object.values(DoctorVerificationStatus)).optional(),
  email: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const userIdParams = z.object({
  id: z.string().min(1),
});

async function verifyDoctor(req, res, next) {
  try {
    const params = verifyDoctorParams.parse(req.params);
    const doctor = await User.findById(params.id);
    if (!doctor) {
      const err = new Error("User not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      return next(err);
    }
    if (doctor.role !== Role.DOCTOR) {
      const err = new Error("Target user is not a doctor");
      err.statusCode = 400;
      err.code = "INVALID_ROLE";
      return next(err);
    }
    if (doctor.doctorVerificationStatus === DoctorVerificationStatus.VERIFIED) {
      return res.json({
        success: true,
        data: {
          message: "Doctor already verified",
          user: {
            id: doctor._id.toString(),
            email: doctor.email,
            fullName: doctor.fullName,
            role: doctor.role,
            doctorVerificationStatus: doctor.doctorVerificationStatus,
          },
        },
      });
    }

    doctor.doctorVerificationStatus = DoctorVerificationStatus.VERIFIED;
    await doctor.save();

    await writeAudit({
      action: "DOCTOR_VERIFIED",
      actorUserId: req.auth.userId,
      targetUserId: doctor._id,
      ip: req.ip,
      meta: { doctorEmail: doctor.email },
    });

    return res.json({
      success: true,
      data: {
        message: "Doctor verified",
        user: {
          id: doctor._id.toString(),
          email: doctor.email,
          fullName: doctor.fullName,
          role: doctor.role,
          doctorVerificationStatus: doctor.doctorVerificationStatus,
        },
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const err = new Error("Validation failed");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      err.details = e.flatten();
      return next(err);
    }
    return next(e);
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const AuditLog = require("../models/AuditLog");
    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ success: true, data: { logs } });
  } catch (e) {
    return next(e);
  }
}

async function listUsers(req, res, next) {
  try {
    const q = listUsersQuery.parse(req.query);
    const page = q.page || 1;
    const limit = q.limit || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (q.role) filter.role = q.role;

    const doctorStatus = q.doctorVerificationStatus || q.status;
    if (doctorStatus) filter.doctorVerificationStatus = doctorStatus;

    if (q.email) {
      filter.email = { $regex: q.email.toLowerCase().trim(), $options: "i" };
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-passwordHash").lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: String(u._id),
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          doctorVerificationStatus: u.doctorVerificationStatus,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
        page,
        limit,
        total,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const err = new Error("Validation failed");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      err.details = e.flatten();
      return next(err);
    }
    return next(e);
  }
}

async function revokeSessions(req, res, next) {
  try {
    const params = userIdParams.parse(req.params);
    const target = await User.findById(params.id).select("_id email role");
    if (!target) {
      const err = new Error("User not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      return next(err);
    }

    const result = await RefreshToken.updateMany({ userId: target._id, revoked: false }, { $set: { revoked: true } });
    const keycloakResult = await logoutKeycloakUserSessionsByEmail(target.email);
    const localRevokedCount = result.modifiedCount ?? result.nModified ?? 0;

    await writeAudit({
      action: "SESSIONS_REVOKED",
      actorUserId: req.auth.userId,
      targetUserId: target._id,
      ip: req.ip,
      meta: {
        localRevokedCount,
        targetEmail: target.email,
        targetRole: target.role,
        provider: "keycloak",
        keycloakUserFound: keycloakResult.keycloakUserFound,
        keycloakUserId: keycloakResult.keycloakUserId,
      },
    });

    return res.json({
      success: true,
      data: {
        message: "Sessions revoked for user",
        userId: target._id.toString(),
        provider: "keycloak",
        keycloakUserFound: keycloakResult.keycloakUserFound,
        keycloakUserId: keycloakResult.keycloakUserId,
        localRevokedRefreshTokens: localRevokedCount,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const err = new Error("Validation failed");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      err.details = e.flatten();
      return next(err);
    }
    return next(e);
  }
}

module.exports = { verifyDoctor, listAuditLogs, listUsers, revokeSessions };
