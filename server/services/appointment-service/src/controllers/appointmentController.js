import Appointment from '../models/Appointment.js';
import { getDoctorById, getAvailableSlots } from '../services/doctorService.js';
import { sendAppointmentConfirmation, sendCancellationNotice } from '../services/notificationService.js';

// ─── POST /api/appointments ───────────────────────────────────────────────────
// Patient books a slot
export const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId, appointmentDate, startTime,
      type, patientNotes, patientName, patientEmail, patientPhone,
    } = req.body;

    // 1. Validate doctor exists and is verified
    let doctor;
    try {
      doctor = await getDoctorById(doctorId);
    } catch {
      return res.status(404).json({ message: 'Doctor not found or service unavailable' });
    }

    if (!doctor.isVerified) {
      return res.status(400).json({ message: 'Doctor is not yet verified' });
    }

    // 2. Validate the slot is available on that date
    const { slots } = await getAvailableSlots(doctorId, appointmentDate);
    const chosenSlot = slots.find((s) => s.startTime === startTime);
    if (!chosenSlot) {
      return res.status(400).json({ message: 'Selected time slot is not available' });
    }

    // 3. Check no existing confirmed appointment occupies that slot
    const clash = await Appointment.findOne({
      doctorId,
      appointmentDate,
      startTime,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (clash) {
      return res.status(409).json({ message: 'This slot is already booked' });
    }

    // 4. Create appointment with status pending
    const appointment = new Appointment({
      patientId:       req.user.id,
      patientName:     patientName || req.user.name,
      patientEmail:    patientEmail || req.user.email,
      patientPhone,
      doctorId,
      doctorName:      doctor.name,
      specialty:       doctor.specialty,
      consultationFee: doctor.consultationFee,
      appointmentDate,
      startTime,
      endTime:         chosenSlot.endTime,
      type:            type || 'online',
      patientNotes,
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment booked. Proceed to payment to confirm.',
      appointment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/my ─────────────────────────────────────────────────
// Patient views their own appointments
export const getMyAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { patientId: req.user.id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    res.json({ appointments, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/doctor ────────────────────────────────────────────
// Doctor views their schedule / appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;

    // Find the doctorId from Doctor Service using req.user.id
    let doctorId;
    try {
      const { data } = await (await import('axios')).default.get(
        `${process.env.DOCTOR_SERVICE_URL}/api/doctors/me/profile`,
        { headers: { Authorization: req.headers.authorization } }
      );
      doctorId = data._id;
    } catch {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const filter = { doctorId };
    if (date)   filter.appointmentDate = date;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    res.json({ appointments, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/:id ────────────────────────────────────────────────
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Patients can only see their own
    if (req.user.role === 'patient' && appointment.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/appointments/:id/confirm ─────────────────────────────────────
// Called internally after payment is confirmed
export const confirmAppointment = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentReference,
      },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Fire notification (non-blocking)
    await sendAppointmentConfirmation({ appointment });

    res.json({ message: 'Appointment confirmed', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/appointments/:id/cancel ──────────────────────────────────────
export const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Only patient who owns it, the doctor, or admin can cancel
    const isOwner  = appointment.patientId === req.user.id;
    const isDoctor = req.user.role === 'doctor';
    const isAdmin  = req.user.role === 'admin';
    if (!isOwner && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${appointment.status} appointment` });
    }

    appointment.status             = 'cancelled';
    appointment.cancelledBy        = req.user.role;
    appointment.cancellationReason = reason || 'No reason provided';
    await appointment.save();

    await sendCancellationNotice({ appointment });

    res.json({ message: 'Appointment cancelled', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/appointments/:id/complete ────────────────────────────────────
// Doctor marks appointment as done after consultation
export const completeAppointment = async (req, res) => {
  try {
    const { doctorNotes } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', doctorNotes },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment marked as completed', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/appointments/:id/meeting-link ────────────────────────────────
// Telemedicine Service sets the video link before session starts
export const setMeetingLink = async (req, res) => {
  try {
    const { meetingLink } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { meetingLink },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/admin/all ─────────────────────────────────────────
// Admin sees all appointments
export const getAllAppointments = async (req, res) => {
  try {
    const { status, date, doctorId, patientId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)   filter.status = status;
    if (date)     filter.appointmentDate = date;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId)filter.patientId = patientId;

    const appointments = await Appointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);
    res.json({ appointments, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/appointments/slots/:doctorId?date= ─────────────────────────────
// Returns available slots minus already-booked ones
export const getBookableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date param required (YYYY-MM-DD)' });

    const { doctorId } = req.params;

    // Get all slots from Doctor Service
    const { slots } = await getAvailableSlots(doctorId, date);

    // Get already-booked start times for that doctor/date
    const booked = await Appointment.find({
      doctorId,
      appointmentDate: date,
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime');

    const bookedTimes = new Set(booked.map((a) => a.startTime));

    const available = slots.map((slot) => ({
      ...slot,
      isBooked: bookedTimes.has(slot.startTime),
    }));

    res.json({ date, doctorId, slots: available });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};