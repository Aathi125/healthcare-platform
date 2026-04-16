import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import { pushRatingUpdate } from '../services/doctorService.js';

// POST /api/reviews — patient submits review after completed appointment
export const createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.patientId !== req.user.id) {
      return res.status(403).json({ message: 'You can only review your own appointments' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed appointments' });
    }

    // Check not already reviewed
    const existing = await Review.findOne({ appointmentId });
    if (existing) return res.status(400).json({ message: 'Already reviewed this appointment' });

    const review = await Review.create({
      appointmentId,
      doctorId:    appointment.doctorId,
      patientId:   req.user.id,
      patientName: appointment.patientName,
      rating,
      comment,
    });

    // Push rating to Doctor Service (non-blocking)
    pushRatingUpdate(appointment.doctorId, rating).catch((err) =>
      console.error('Rating push failed:', err.message)
    );

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/doctor/:doctorId — public: read doctor reviews
export const getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctorId: req.params.doctorId })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};