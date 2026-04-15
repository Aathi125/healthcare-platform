import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId:   { type: String, required: true },  // from Patient Service
    patientName: { type: String, required: true },
    patientEmail:{ type: String, required: true },
    patientPhone:{ type: String },

    doctorId:    { type: String, required: true },  // Doctor Service ObjectId as string
    doctorName:  { type: String, required: true },
    specialty:   { type: String, required: true },
    consultationFee: { type: Number, required: true },

    appointmentDate: { type: String, required: true }, // "2026-04-20"
    startTime:   { type: String, required: true },     // "09:00"
    endTime:     { type: String, required: true },     // "09:30"

    type: {
      type: String,
      enum: ['online', 'in-person'],
      default: 'online',
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
      default: 'pending',
    },

    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentReference: { type: String }, // reference from Payment Service

    // Video session (filled by Telemedicine Service)
    meetingLink: { type: String },

    // Cancellation details
    cancelledBy:     { type: String },           // 'patient' | 'doctor' | 'admin'
    cancellationReason: { type: String },

    // Notes
    patientNotes: { type: String },             // symptoms patient describes when booking
    doctorNotes:  { type: String },             // private doctor notes after visit
  },
  { timestamps: true }
);

// Index for fast queries: all appointments for a doctor on a date
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
// All appointments for a patient
appointmentSchema.index({ patientId: 1, status: 1 });

export default mongoose.model('Appointment', appointmentSchema);