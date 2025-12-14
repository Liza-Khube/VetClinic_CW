import express from 'express';
import { createPet, viewPetsOwner } from '../controllers/petController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-pet', authenticate, authorize('owner'), createPet);
router.get('/view-my-pets', authenticate, authorize('owner'), viewPetsOwner);

export default router;
