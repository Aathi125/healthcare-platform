const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      default: ""
    },
    instructions: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
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
    doctorId: {
      type: String,
      required: true,
      index: true
    },
    doctorName: {
      type: String,
      required: true
    },
    appointmentId: {
      type: String,
      default: ""
    },
    medicines: {
      type: [medicineSchema],
      default: []
    },
    notes: {
      type: String,
      default: ""
    },
    issuedDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
