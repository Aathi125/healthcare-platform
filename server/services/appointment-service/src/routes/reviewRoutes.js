import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.js';
import { createReview, getDoctorReviews } from '../controllers/reviewController.js';

const router = Router();

router.post('/',                   protect, authorizeRoles('patient'), createReview);
router.get('/doctor/:doctorId',    getDoctorReviews);

export default router;