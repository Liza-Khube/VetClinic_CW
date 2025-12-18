import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { UserRepository } from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET;

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}
export class PermissionDeniedError extends Error {
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

  async registerOwner(email, password, name, surname, phone = null) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
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
    specialisation,
    phone = null,
    experience = null
  ) {
    const creator = await this.userRepository.findById(adminId);

    if (!creator || creator.role !== 'admin') {
      throw new PermissionDeniedError(
        'Only administrators can create vet accounts'
      );
    }

    if (experience !== null && experience < 0) {
      throw new Error('Experience cannot be negative');
    }

    const existingUser = await this.userRepository.findByEmail(vetEmail);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(vetPassword, this.SALT_ROUNDS);

    const newVet = await this.userRepository.createVetProfile(
      vetEmail,
      passwordHash,
      name,
      surname,
      specialisation,
      phone,
      experience
    );

    return newVet;
  }

  async getVetsDetails(minExperience, isActive, limit, offset) {
    const vetUsers = await this.userRepository.findVetsWithFiltration(
      minExperience,
      isActive,
      limit,
      offset
    );

    const filteredVets = vetUsers.map((vetUser) => {
      return {
        vet_user_id: vetUser.user_id,
        email: vetUser.email,
        name: vetUser.name,
        surname: vetUser.surname,
        phone: vetUser.phone || null,
        experience: vetUser.vet.experience || null,
        specialisation: vetUser.vet.specialisation,
        is_active: vetUser.vet.is_active,
        updated_at: vetUser.updated_at,
      };
    });

    return {
      pagination: {
        limit,
        offset,
      },

      vets: filteredVets,
    };
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
      {
        expiresIn: '3h',
      }
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

  async toggleVetActiveness(vetUserId, lastKnownUpdate) {
    return await prisma.$transaction(async (tx) => {
      const vet = await this.userRepository.findVetById(vetUserId, tx);

      if (!vet || vet.user.is_deleted) {
        throw { status: 404, message: 'Vet not found' };
      }

      const newActiveStatus = !vet.is_active;

      if (newActiveStatus) {
        if (!vet.specialisation || vet.experience < 0) {
          throw {
            status: 400,
            message:
              'Cannot activate: vet does not have specialisation or experience is a negative number',
          };
        }
      }

      const result = await this.userRepository.updateVetActiveness(
        vetUserId,
        newActiveStatus,
        lastKnownUpdate,
        tx
      );

      if (result.count === 0) {
        throw {
          status: 409,
          message: 'Vet profile was already updated. Refresh the data',
        };
      }

      return { user_id: vetUserId, is_active: newActiveStatus };
    });
  }

  async getOwnersList(limit, offset) {
    const ownerUsers = await this.userRepository.findOwnersList(limit, offset);

    const filteredOwners = ownerUsers.map((ownerUser) => {
      return {
        owner_user_id: ownerUser.user_id,
        email: ownerUser.email,
        name: ownerUser.name,
        surname: ownerUser.surname,
        phone: ownerUser.phone || null,
        updated_at: ownerUser.updated_at,
      };
    });

    return {
      pagination: {
        limit,
        offset,
      },

      owners: filteredOwners,
    };
  }
}
