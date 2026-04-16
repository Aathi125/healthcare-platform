const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { User, Role, DoctorVerificationStatus } = require("../models/User");
const { writeAudit } = require("../utils/audit");
const { createKeycloakUser, refreshOAuthToken, logoutOAuthSession } = require("../utils/keycloakAdmin");

const oauthRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(120),
});
const oauthRefreshSchema = z.object({
  refreshToken: z.string().min(10),
});
const oauthLogoutSchema = z.object({
  refreshToken: z.string().min(10),
});

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function toPublicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    fullName: userDoc.fullName,
    role: userDoc.role,
    doctorVerificationStatus: userDoc.doctorVerificationStatus,
  };
}

async function oauthRegisterCore(req, role) {
  const body = oauthRegisterSchema.parse(req.body);
  const normalizedEmail = normalizeEmail(body.email);
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    err.code = "CONFLICT";
    throw err;
  }

  await createKeycloakUser({
    email: normalizedEmail,
    fullName: body.fullName,
    password: body.password,
    realmRole: role,
  });

  const passwordHash = await bcrypt.hash(body.password, 12);
  const doctorVerificationStatus =
    role === Role.DOCTOR ? DoctorVerificationStatus.PENDING_VERIFICATION : DoctorVerificationStatus.NOT_APPLICABLE;

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    fullName: body.fullName,
    role,
    doctorVerificationStatus,
  });

  await writeAudit({
    action: "REGISTER_OAUTH_SUCCESS",
    actorUserId: user._id,
    targetUserId: user._id,
    ip: req.ip,
    meta: { role: user.role, provider: "keycloak" },
  });

  return user;
}

async function oauthRegisterPatient(req, res, next) {
  try {
    const user = await oauthRegisterCore(req, Role.PATIENT);
    return res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(user),
        message: "Registration successful. Use OAuth2 login to obtain your access token.",
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
    if (e?.code === "CONFLICT" || e?.statusCode === 409 || e?.code === 11000) {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      err.code = "CONFLICT";
      return next(err);
    }
    if (String(e?.message || "").includes("required for OAuth2 registration")) {
      const err = new Error(e.message);
      err.statusCode = 500;
      err.code = "CONFIG_ERROR";
      return next(err);
    }
    if (e?.code === "CONFIG_ERROR") {
      const err = new Error(e.message || "OAuth2 registration provider configuration error");
      err.statusCode = e.statusCode || 500;
      err.code = "CONFIG_ERROR";
      return next(err);
    }
    return next(e);
  }
}

async function oauthRegisterDoctor(req, res, next) {
  try {
    const user = await oauthRegisterCore(req, Role.DOCTOR);
    return res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(user),
        message: "Registration successful. Await admin verification before app access is granted.",
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
    if (e?.code === "CONFLICT" || e?.statusCode === 409 || e?.code === 11000) {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      err.code = "CONFLICT";
      return next(err);
    }
    if (String(e?.message || "").includes("required for OAuth2 registration")) {
      const err = new Error(e.message);
      err.statusCode = 500;
      err.code = "CONFIG_ERROR";
      return next(err);
    }
    if (e?.code === "CONFIG_ERROR") {
      const err = new Error(e.message || "OAuth2 registration provider configuration error");
      err.statusCode = e.statusCode || 500;
      err.code = "CONFIG_ERROR";
      return next(err);
    }
    return next(e);
  }
}

async function me(req, res) {
  if (!req.auth?.userId) {
    return res.json({
      success: true,
      data: {
        user: {
          id: req.auth?.oauthSub || null,
          email: req.auth?.email || null,
          fullName: null,
          role: req.auth?.role || null,
          doctorVerificationStatus: null,
        },
      },
    });
  }
  const user = await User.findById(req.auth.userId).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
  }
  if (user.role === Role.DOCTOR && user.doctorVerificationStatus !== DoctorVerificationStatus.VERIFIED) {
    return res.status(403).json({
      success: false,
      error: { code: "DOCTOR_NOT_VERIFIED", message: "Doctor account is pending admin verification" },
    });
  }
  return res.json({ success: true, data: { user: toPublicUser(user) } });
}

async function oauthRefresh(req, res, next) {
  try {
    const body = oauthRefreshSchema.parse(req.body);
    const tokenData = await refreshOAuthToken(body.refreshToken);
    return res.json({
      success: true,
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        refreshExpiresIn: tokenData.refresh_expires_in,
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

async function oauthLogout(req, res, next) {
  try {
    const body = oauthLogoutSchema.parse(req.body);
    await logoutOAuthSession(body.refreshToken);
    await writeAudit({
      action: "OAUTH_LOGOUT",
      actorUserId: req.auth?.userId || null,
      ip: req.ip,
      meta: { oauthSub: req.auth?.oauthSub || null },
    });
    return res.json({ success: true, data: { message: "Logged out from OAuth2 provider" } });
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

module.exports = {
  me,
  oauthRegisterPatient,
  oauthRegisterDoctor,
  oauthRefresh,
  oauthLogout,
};
