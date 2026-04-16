const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      trim: true
    },
    day: {
      type: String,
      trim: true
    },
    slots: [
      {
        type: String,
        trim: true
      }
    ]
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    experience: {
      type: Number,
      default: 0
    },
    hospital: {
      type: String,
      default: ""
    },
    consultationFee: {
      type: Number,
      default: 0
    },
    availability: {
      type: [availabilitySchema],
      default: []
    },
    verified: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
