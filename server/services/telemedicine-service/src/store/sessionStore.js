const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ApiError = require("../utils/apiError");

const sessions = new Map();
const dataDirectory = path.resolve(__dirname, "../../data");
const storageFilePath = path.join(dataDirectory, "sessions.json");

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode() {
  const bytes = crypto.randomBytes(12);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return out;
}

function isInviteCodeTaken(code, exceptSessionId) {
  const c = String(code || "").toUpperCase();
  for (const s of sessions.values()) {
    if (exceptSessionId && s.id === exceptSessionId) continue;
    if (String(s.inviteCode || "").toUpperCase() === c) return true;
  }
  return false;
}

function allocateInviteCode(exceptSessionId = null) {
  for (let i = 0; i < 100; i++) {
    const code = generateInviteCode();
    if (!isInviteCodeTaken(code, exceptSessionId)) return code;
  }
  throw new Error("Could not allocate unique invite code");
}

function persistSessionsToDisk() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  const payload = JSON.stringify(Array.from(sessions.values()), null, 2);
  fs.writeFileSync(storageFilePath, payload, "utf8");
}

function loadSessionsFromDisk() {
  if (!fs.existsSync(storageFilePath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(storageFilePath, "utf8");
    if (!raw.trim()) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    for (const session of parsed) {
      if (session?.id) {
        sessions.set(session.id, session);
      }
    }

    let migrated = false;
    for (const session of sessions.values()) {
      if (!session.inviteCode || String(session.inviteCode).length < 6) {
        session.inviteCode = allocateInviteCode(session.id);
        migrated = true;
      }
    }
    if (migrated) {
      persistSessionsToDisk();
    }
  } catch (error) {
    console.error("Failed to load persisted sessions:", error);
  }
}

function createSession({ appointmentId, doctorId, patientId, scheduledAt }) {
  const sessionId = uuidv4();
  const roomName = `consultation-${appointmentId}-${sessionId.slice(0, 8)}`;
  const inviteCode = allocateInviteCode();

  const session = {
    id: sessionId,
    inviteCode,
    roomName,
    appointmentId,
    doctorId,
    patientId,
    scheduledAt: scheduledAt || null,
    status: "scheduled",
    createdAt: new Date().toISOString(),
    startedAt: null,
    endedAt: null,
  };

  sessions.set(sessionId, session);
  persistSessionsToDisk();
  return session;
}

function getSessionById(sessionId) {
  return sessions.get(sessionId) || null;
}

function getSessionByAppointmentId(appointmentId) {
  const normalizedAppointmentId = String(appointmentId || "").trim();
  if (!normalizedAppointmentId) {
    return null;
  }

  let best = null;
  for (const session of sessions.values()) {
    if (String(session.appointmentId) !== normalizedAppointmentId) continue;
    if (!best || String(session.createdAt || "") > String(best.createdAt || "")) {
      best = session;
    }
  }
  return best;
}

function normalizeInviteCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function getSessionByInviteCode(rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (code.length < 6) return null;
  for (const session of sessions.values()) {
    if (normalizeInviteCode(session.inviteCode) === code) {
      return session;
    }
  }
  return null;
}

function ensureSession(sessionId) {
  const normalizedInput = String(sessionId || "").trim();
  const session =
    getSessionById(normalizedInput) ||
    getSessionByAppointmentId(normalizedInput) ||
    getSessionByInviteCode(normalizedInput);
  if (!session) {
    throw new ApiError(404, "Video session not found for the given session, appointment, or invite code");
  }
  return session;
}

function canJoinSession(session, userId, role) {
  const r = String(role || "").toLowerCase();
  const uid = String(userId || "").trim();
  if (r === "admin") {
    return true;
  }

  const docId = String(session.doctorId || "").trim();
  const patId = String(session.patientId || "").trim();
  const isDoctor = r === "doctor" && docId === uid;
  const isPatient = r === "patient" && patId === uid;
  return isDoctor || isPatient;
}

function markSessionStarted(session) {
  if (session.status === "scheduled") {
    session.status = "active";
    session.startedAt = new Date().toISOString();
    persistSessionsToDisk();
  }
  return session;
}

function markSessionEnded(session) {
  if (session.status === "ended") {
    throw new ApiError(400, "Session is already ended");
  }

  session.status = "ended";
  session.endedAt = new Date().toISOString();
  persistSessionsToDisk();
  return session;
}

module.exports = {
  canJoinSession,
  createSession,
  ensureSession,
  getSessionById,
  getSessionByInviteCode,
  loadSessionsFromDisk,
  markSessionEnded,
  markSessionStarted,
};
