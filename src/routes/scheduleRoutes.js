import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createSchedule,
  getSchedule,
  getSlots,
} from '../controllers/scheduleController.js';

const router = express.Router();

router.post(
  '/vets/:vetUserId/schedule',
  authenticate,
  authorize('admin'),
  createSchedule
);

router.get('/vets/:vetUserId/schedule', getSchedule);

router.get('/vets/:vetUserId/schedule/slots', getSlots);

export default router;
