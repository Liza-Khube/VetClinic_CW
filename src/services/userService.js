import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET;

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}
class PermissionDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.SALT_ROUNDS = 10;
  }

  async registerOwner(email, password, name, surname, phone = undefined) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    const newUser = await this.userRepository.createOwnerProfile(
      email,
      passwordHash,
      name,
      surname,
      phone
    );
    return newUser;
  }

  async createVetAccount(
    adminId,
    vetEmail,
    vetPassword,
    name,
    surname,
    experience,
    specialisation
  ) {
    const creator = await this.userRepository.findById(adminId);

    if (!creator || creator.role !== 'admin') {
      throw new PermissionDeniedError(
        'Only administrators can create vet accounts.'
      );
    }

    if (experience < 0) {
      throw new Error('Experience cannot be negative');
    }

    const existingUser = await this.userRepository.findByEmail(vetEmail);
    if (existingUser) {
      throw new ConflictError('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(vetPassword, this.SALT_ROUNDS);

    const newVet = await this.userRepository.createVetProfile(
      vetEmail,
      passwordHash,
      name,
      surname,
      experience,
      specialisation
    );

    return newVet;
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.is_deleted) {
      throw new Error('Invalid email');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '3h' }
    );

    return {
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        surname: user.surname,
        phone: user.phone || null,
      },
    };
  }
}
