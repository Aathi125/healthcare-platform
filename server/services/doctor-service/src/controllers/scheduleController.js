import Schedule from '../models/Schedule.js';
import Doctor from '../models/Doctor.js';

// POST /api/schedules
export const createSchedule = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const schedule = new Schedule({
      ...req.body,
      doctorId: doctor._id,
    });

    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Schedule for this day already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/schedules/doctor/:doctorId
export const getDoctorSchedule = async (req, res) => {
  try {
    const schedules = await Schedule.find({
      doctorId: req.params.doctorId,
      isActive: true,
    });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/schedules/slots/:doctorId
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date query param required (YYYY-MM-DD)' });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    const schedule = await Schedule.findOne({
      doctorId: req.params.doctorId,
      dayOfWeek,
      isActive: true,
    });

    if (!schedule) return res.json({ slots: [] });

    if (schedule.blockedDates.includes(date)) {
      return res.json({ slots: [], blocked: true });
    }

    const slots = schedule.generateSlots(date);

    res.json({
      slots,
      slotDurationMinutes: schedule.slotDurationMinutes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/schedules/:id
export const updateSchedule = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });

    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, doctorId: doctor._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/schedules/:id
export const deleteSchedule = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });

    const schedule = await Schedule.findOneAndDelete({
      _id: req.params.id,
      doctorId: doctor._id,
    });

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/schedules/:id/block
export const blockDates = async (req, res) => {
  try {
    const { dates } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.id });

    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, doctorId: doctor._id },
      { $addToSet: { blockedDates: { $each: dates } } },
      { new: true }
    );

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};