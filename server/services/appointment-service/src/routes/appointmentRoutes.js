import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.js';
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAppointmentById,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  setMeetingLink,
  getAllAppointments,
  getBookableSlots,
} from '../controllers/appointmentController.js';

const router = Router();

// Public — check available bookable slots (Doctor + already-booked merged)
router.get('/slots/:doctorId', getBookableSlots);

// Patient routes
router.post('/',    protect, authorizeRoles('patient'), bookAppointment);
router.get('/my',   protect, authorizeRoles('patient'), getMyAppointments);

// Doctor routes
router.get('/doctor', protect, authorizeRoles('doctor'), getDoctorAppointments);
router.patch('/:id/complete', protect, authorizeRoles('doctor'), completeAppointment);

// Admin routes
router.get('/admin/all', protect, authorizeRoles('admin'), getAllAppointments);

// Shared — owner patient, doctor, or admin can view/cancel
router.get('/:id',    protect, authorizeRoles('patient','doctor','admin'), getAppointmentById);
router.patch('/:id/cancel', protect, authorizeRoles('patient','doctor','admin'), cancelAppointment);

// Internal — called by Payment Service and Telemedicine Service (no role guard needed on internal network)
router.patch('/:id/confirm',      confirmAppointment);
router.patch('/:id/meeting-link', setMeetingLink);

export default router;