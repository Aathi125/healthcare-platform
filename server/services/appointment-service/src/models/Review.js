import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, unique: true },
    doctorId:      { type: String, required: true },
    patientId:     { type: String, required: true },
    patientName:   { type: String, required: true },
    rating:        { type: Number, required: true, min: 1, max: 5 },
    comment:       { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);