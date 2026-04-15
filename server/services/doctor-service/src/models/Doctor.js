import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    specialty: {
      type: String,
      required: true,
      enum: [
        'General Practitioner', 'Cardiologist', 'Dermatologist',
        'Neurologist', 'Pediatrician', 'Psychiatrist',
        'Orthopedic Surgeon', 'Gynecologist', 'ENT Specialist',
        'Oncologist', 'Ophthalmologist', 'Urologist',
      ],
    },
    qualifications: [{ type: String }],
    licenseNumber: { type: String, required: true, unique: true },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, required: true },
    bio: { type: String, maxlength: 1000 },
    profileImage: { type: String },
    hospital: { type: String },
    address: {
      city: String,
      district: String,
    },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

doctorSchema.methods.updateRating = function (newRating) {
  this.totalRatings += 1;
  this.rating =
    (this.rating * (this.totalRatings - 1) + newRating) /
    this.totalRatings;
  return this.save();
};

export default mongoose.model('Doctor', doctorSchema);