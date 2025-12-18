import express from 'express';
import { viewAllPets, viewOwnerPetReport } from '../controllers/petController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/all-pets', authenticate, authorize('admin'), viewAllPets);
router.get('/owners-with-pets', authenticate, authorize('admin'), viewOwnerPetReport);

export default router;
