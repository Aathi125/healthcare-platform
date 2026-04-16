const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientName: {
      type: String,
      required: true
    },
    patientEmail: {
      type: String,
      required: true
    },
    doctorId: {
      type: String,
      required: true,
      index: true
    },
    doctorProfileId: {
      type: String,
      required: true
    },
    doctorName: {
      type: String,
      required: true
    },
    doctorEmail: {
      type: String,
      required: true
    },
    specialization: {
      type: String,
      default: ""
    },
    consultationFee: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"],
      default: "PENDING"
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    meetingLink: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorProfileId: 1, appointmentDate: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
