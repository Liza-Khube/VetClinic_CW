import express from 'express';
import {
  registerUser,
  loginUser,
  createVet,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/create-vet', authenticate, authorize('admin'), createVet);

export default router;
