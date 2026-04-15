import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true },
    dosage:    { type: String, required: true },
    frequency: { type: String, required: true },
    duration:  { type: String, required: true },
    notes:     { type: String },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId:   { type: String, required: true },
    patientName: { type: String, required: true },
    diagnosis:   { type: String, required: true },
    medicines:   [medicineSchema],
    notes:       { type: String },
    followUpDate:{ type: Date },
    issuedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Prescription', prescriptionSchema);