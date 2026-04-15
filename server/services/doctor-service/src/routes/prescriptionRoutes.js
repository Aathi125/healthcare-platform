import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.js';
import * as ctrl from '../controllers/prescriptionController.js';

const router = express.Router();

router.post(
  '/',
  protect,
  authorizeRoles('doctor'),
  ctrl.createPrescription
);

router.get(
  '/appointment/:appointmentId',
  protect,
  authorizeRoles('doctor', 'patient', 'admin'),
  ctrl.getByAppointment
);

router.get(
  '/patient/:patientId',
  protect,
  authorizeRoles('patient', 'doctor', 'admin'),
  ctrl.getPatientPrescriptions
);

router.get(
  '/my',
  protect,
  authorizeRoles('doctor'),
  ctrl.getMyPrescriptions
);

export default router;