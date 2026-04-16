require("dotenv").config();
const app = require("./app");
const { connectDb } = require("./config/db");
const { User, Role, DoctorVerificationStatus } = require("./models/User");
const bcrypt = require("bcryptjs");

function assertEnv() {
  const required = ["MONGODB_URI", "OAUTH2_ISSUER_URL", "OAUTH2_PUBLIC_KEY", "OAUTH2_CLIENT_ID", "OAUTH2_CLIENT_SECRET"];
  for (const key of required) {
    if (!process.env[key] || !process.env[key].trim()) {
      throw new Error(`${key} is required`);
    }
  }
}

async function ensureSeedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (!email || !password) return;

  const exists = await User.findOne({ email });
  if (exists) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email,
    passwordHash,
    fullName: process.env.SEED_ADMIN_NAME || "Platform Admin",
    role: Role.ADMIN,
    doctorVerificationStatus: DoctorVerificationStatus.NOT_APPLICABLE,
  });
  console.log("Seed admin created:", email);
}

async function start() {
  assertEnv();
  console.log("Connecting to MongoDB…");
  await connectDb();
  console.log("MongoDB connected.");
  await ensureSeedAdmin();
  const port = Number(process.env.PORT) || 8081;
  app.listen(port, () => {
    console.log(`auth-service listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
