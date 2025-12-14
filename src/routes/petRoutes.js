import express from 'express';
import { viewAllPets } from '../controllers/petController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/view-all-pets', authenticate, authorize('admin'), viewAllPets);

export default router;
