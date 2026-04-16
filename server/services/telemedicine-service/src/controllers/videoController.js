const ApiError = require("../utils/apiError");
const {
  buildJitsiJoinPayload,
  createVideoAccessToken,
  isTwilioConfigured,
} = require("../services/twilioVideoService");
const {
  canJoinSession,
  createSession,
  ensureSession,
  getSessionByInviteCode,
  markSessionEnded,
  markSessionStarted,
} = require("../store/sessionStore");

function getInviteInfo(req, res, next) {
  try {
    const raw = req.params.code || "";
    const session = getSessionByInviteCode(raw);
    if (!session || session.status === "ended") {
      throw new ApiError(404, "Invite not found or visit has ended");
    }
    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        appointmentId: session.appointmentId,
        inviteCode: session.inviteCode,
        status: session.status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

function createVideoSession(req, res, next) {
  try {
    const { appointmentId, patientId, doctorId, scheduledAt } = req.body;
    const callerId = String(req.user.id);
    const callerRole = String(req.user.role || "").toLowerCase();

    if (!appointmentId || !patientId) {
      throw new ApiError(400, "appointmentId and patientId are required");
    }

    const resolvedDoctorId = String(doctorId || callerId);
    if (callerRole !== "admin" && resolvedDoctorId !== callerId) {
      throw new ApiError(403, "Doctors can only create their own sessions");
    }

    const session = createSession({
      appointmentId: String(appointmentId),
      patientId: String(patientId),
      doctorId: String(resolvedDoctorId),
      scheduledAt: scheduledAt || null
    });

    return res.status(201).json({
      message: "Video session created",
      data: session
    });
  } catch (error) {
    return next(error);
  }
}

function getVideoSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = ensureSession(sessionId);

    if (!canJoinSession(session, req.user.id, req.user.role)) {
      throw new ApiError(403, "You do not have access to this session");
    }

    return res.status(200).json({ data: session });
  } catch (error) {
    return next(error);
  }
}

function joinVideoSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = ensureSession(sessionId);

    if (session.status === "ended") {
      throw new ApiError(400, "Session has ended");
    }

    if (!canJoinSession(session, req.user.id, req.user.role)) {
      throw new ApiError(403, "You do not have access to this session");
    }

    markSessionStarted(session);

    const identity = `${req.user.role}-${req.user.id}`;

    const base = {
      sessionId: session.id,
      roomName: session.roomName,
      identity,
    };

    if (isTwilioConfigured()) {
      const token = createVideoAccessToken({
        roomName: session.roomName,
        identity,
      });
      return res.status(200).json({
        message: "Video token generated (Twilio)",
        data: {
          ...base,
          provider: "twilio",
          token,
        },
      });
    }

    const jitsi = buildJitsiJoinPayload({ session, identity });
    return res.status(200).json({
      message:
        "Join URL generated (Jitsi dev fallback). Set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET for Twilio Video.",
      data: {
        ...base,
        ...jitsi,
      },
    });
  } catch (error) {
    return next(error);
  }
}

function endVideoSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = ensureSession(sessionId);

    const role = String(req.user.role || "").toLowerCase();
    const canEnd =
      role === "admin" || (role === "doctor" && String(session.doctorId) === String(req.user.id));

    if (!canEnd) {
      throw new ApiError(403, "Only the assigned doctor or admin can end session");
    }

    markSessionEnded(session);

    return res.status(200).json({
      message: "Video session ended",
      data: session
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createVideoSession,
  endVideoSession,
  getInviteInfo,
  getVideoSession,
  joinVideoSession,
};
