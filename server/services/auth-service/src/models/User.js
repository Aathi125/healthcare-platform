const mongoose = require("mongoose");

const DoctorVerificationStatus = {
  NOT_APPLICABLE: "NOT_APPLICABLE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
};

const Role = {
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
};

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    doctorVerificationStatus: {
      type: String,
      enum: Object.values(DoctorVerificationStatus),
      default: DoctorVerificationStatus.NOT_APPLICABLE,
    },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model("User", userSchema),
  Role,
  DoctorVerificationStatus,
};
