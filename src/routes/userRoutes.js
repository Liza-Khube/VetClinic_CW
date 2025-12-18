import express from 'express';
import {
  registerUser,
  loginUser,
  createVet,
  getVets,
  updateVetActiveStatus,
  getOwners,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/create-vet', authenticate, authorize('admin'), createVet);

router.get('/vets', getVets);

router.get('/owners', authenticate, authorize('admin'), getOwners);

router.patch(
  '/vets/:vetUserId/is-active',
  authenticate,
  authorize('admin'),
  updateVetActiveStatus
);

export default router;
