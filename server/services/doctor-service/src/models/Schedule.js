import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    },
    startTime: { type: String, required: true },
    endTime:   { type: String, required: true },
    slotDurationMinutes: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
    blockedDates: [{ type: String }],
  },
  { timestamps: true }
);

scheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

scheduleSchema.methods.generateSlots = function (dateStr) {
  const slots = [];
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM]     = this.endTime.split(':').map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal   = endH * 60 + endM;

  for (let t = startTotal; t + this.slotDurationMinutes <= endTotal; t += this.slotDurationMinutes) {
    const h  = String(Math.floor(t / 60)).padStart(2, '0');
    const m  = String(t % 60).padStart(2, '0');
    const he = String(Math.floor((t + this.slotDurationMinutes) / 60)).padStart(2, '0');
    const me = String((t + this.slotDurationMinutes) % 60).padStart(2, '0');

    slots.push({
      date: dateStr,
      startTime: `${h}:${m}`,
      endTime: `${he}:${me}`
    });
  }

  return slots;
};

export default mongoose.model('Schedule', scheduleSchema);