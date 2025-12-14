import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createSchedule,
  getSchedule,
} from '../controllers/scheduleController.js';

const router = express.Router();

router.post(
  '/vets/:vetUserId/schedule',
  authenticate,
  authorize('admin'),
  createSchedule
);

router.get('/vets/:vetUserId/schedule', getSchedule);

export default router;
