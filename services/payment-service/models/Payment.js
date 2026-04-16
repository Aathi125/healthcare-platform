const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    patientName: {
      type: String,
      default: ""
    },
    patientEmail: {
      type: String,
      default: ""
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "LKR"
    },
    method: {
      type: String,
      default: "MOCK_CARD"
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING"
    },
    transactionRef: {
      type: String,
      default: ""
    },
    stripeCheckoutSessionId: {
      type: String,
      default: "",
      index: true
    },
    stripePaymentIntentId: {
      type: String,
      default: ""
    },
    paidAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
