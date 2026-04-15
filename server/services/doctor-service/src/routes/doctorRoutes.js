import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.js';
import * as ctrl from '../controllers/doctorController.js';

const router = express.Router();

// Doctor-only routes
router.get('/me/profile', protect, authorizeRoles('doctor'), ctrl.getMyProfile);
router.post('/profile', protect, authorizeRoles('doctor'), ctrl.createProfile);
router.put('/profile', protect, authorizeRoles('doctor'), ctrl.updateProfile);

// Public routes
router.get('/', ctrl.getAllDoctors);
router.get('/:id', ctrl.getDoctorById);

// Admin-only routes
router.patch('/:id/verify', protect, authorizeRoles('admin'), ctrl.verifyDoctor);

// Internal route
router.patch('/:id/rating', ctrl.updateRating);

export default router;