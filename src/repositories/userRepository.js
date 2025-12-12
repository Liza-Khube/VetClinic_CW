import prisma from '../prismaClient.js';

export class UserRepository {
  async findById(userId) {
    return prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(email, passwordHash, role, name, surname, phone) {
    return prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role,
        name,
        surname,
        phone,
      },
    });
  }

  async createOwnerProfile(email, passwordHash, name, surname, phone) {
    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'owner',
          name,
          surname,
          phone,
        },
      });

      await tx.owner.create({
        data: {
          user_id: newUser.user_id,
        },
      });

      return newUser;
    });
  }

  async createVetProfile(
    email,
    passwordHash,
    name,
    surname,
    experience,
    specialisation
  ) {
    return prisma.$transaction(async (tx) => {
      const newVetUser = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'vet',
          name,
          surname,
        },
      });

      await tx.vet.create({
        data: {
          user_id: newVetUser.user_id,
          experience,
          specialisation,
          is_active: true,
        },
      });

      return newVetUser;
    });
  }

  async updateRole(userId, newRole) {
    return prisma.user.update({
      where: { user_id: userId },
      data: { role: newRole },
    });
  }
}
