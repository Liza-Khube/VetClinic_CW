import express from 'express';
import { createPet, updatePet, viewPetsOwner } from '../controllers/petController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-pet', authenticate, authorize('owner'), createPet);
router.put('/update-pet/:id', authenticate, authorize('owner'), updatePet);
router.get('/my-pets', authenticate, authorize('owner'), viewPetsOwner);

export default router;
