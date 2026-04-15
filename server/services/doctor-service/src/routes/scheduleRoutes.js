import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.js';
import * as ctrl from '../controllers/scheduleController.js';

const router = express.Router();

// Public routes
router.get('/doctor/:doctorId', ctrl.getDoctorSchedule);
router.get('/slots/:doctorId', ctrl.getAvailableSlots);

// Doctor-only routes
router.post('/', protect, authorizeRoles('doctor'), ctrl.createSchedule);
router.put('/:id', protect, authorizeRoles('doctor'), ctrl.updateSchedule);
router.delete('/:id', protect, authorizeRoles('doctor'), ctrl.deleteSchedule);
router.patch('/:id/block', protect, authorizeRoles('doctor'), ctrl.blockDates);

export default router;