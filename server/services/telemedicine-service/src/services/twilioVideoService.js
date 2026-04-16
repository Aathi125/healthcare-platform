const twilio = require("twilio");

const ApiError = require("../utils/apiError");

function isTwilioConfigured() {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const apiKey = (process.env.TWILIO_API_KEY || "").trim();
  const apiSecret = (process.env.TWILIO_API_SECRET || "").trim();
  return Boolean(accountSid && apiKey && apiSecret);
}

function buildJitsiJoinPayload({ session, identity }) {
  const idPart = String(session.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 28) || "session";
  const roomSlug = `HealthcareConsult${idPart}`;
  return {
    provider: "jitsi",
    jitsiUrl: `https://meet.jit.si/${roomSlug}`,
    displayName: identity,
  };
}

function getVideoTokenTtl() {
  const ttl = Number(process.env.TWILIO_TOKEN_TTL_SECONDS || 3600);
  if (Number.isNaN(ttl) || ttl <= 0) {
    throw new ApiError(500, "TWILIO_TOKEN_TTL_SECONDS must be a positive number");
  }
  return ttl;
}

function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;

  if (!accountSid || !apiKey || !apiSecret) {
    throw new ApiError(500, "Twilio credentials are missing");
  }

  return { accountSid, apiKey, apiSecret };
}

function createVideoAccessToken({ roomName, identity }) {
  const { accountSid, apiKey, apiSecret } = getTwilioCredentials();
  const ttl = getVideoTokenTtl();

  const accessToken = new twilio.jwt.AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl
  });

  const videoGrant = new twilio.jwt.AccessToken.VideoGrant({ room: roomName });
  accessToken.addGrant(videoGrant);

  return accessToken.toJwt();
}

module.exports = {
  buildJitsiJoinPayload,
  createVideoAccessToken,
  isTwilioConfigured,
};
