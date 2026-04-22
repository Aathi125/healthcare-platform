const mongoose = require("mongoose");

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: ""
    },
    dateOfBirth: {
      type: String,
      default: ""
    },
    gender: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    medicalHistory: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientProfile", patientProfileSchema);
