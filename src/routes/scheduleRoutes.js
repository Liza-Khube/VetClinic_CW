import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createSchedule } from '../controllers/scheduleController.js';

const router = express.Router();

router.post(
  '/vets/:vetUserId/schedule',
  authenticate,
  authorize('admin'),
  createSchedule
);

export default router;
