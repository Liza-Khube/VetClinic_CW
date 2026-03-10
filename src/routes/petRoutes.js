import express from 'express';
import { hardDeletePet, viewAllPets, viewOwnerPetReport } from '../controllers/petController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/all-pets', authenticate, authorize('admin'), viewAllPets);
router.get('/owners-with-pets', authenticate, authorize('admin'), viewOwnerPetReport);
router.delete('/delete-pet/:id', authenticate, authorize('admin'), hardDeletePet);

export default router;
