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

  async createOwnerProfile(email, passwordHash, name, surname, phone = null) {
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
    specialisation,
    phone = null,
    experience = null
  ) {
    return prisma.$transaction(async (tx) => {
      const newVetUser = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'vet',
          name,
          surname,
          phone,
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

  async findVetsWithFiltration(
    minExperience = 0,
    isActive,
    limit = null,
    offset = 0
  ) {
    const minExp = minExperience || 0; // якщо minExperience буде null, то щоб стало 0 (для правильної фільтрації в подальшому)

    const expFiltration = [
      {
        experience: {
          gte: minExp,
        },
      },
      ...(minExp === 0 ? [{ experience: null }] : []),
    ];

    const filterOptions = [{ OR: expFiltration }];

    if (isActive !== undefined) filterOptions.push({ is_active: isActive });

    const selectOptions = {
      where: {
        role: 'vet',
        vet: {
          is: {
            AND: filterOptions,
          },
        },
      },
      include: {
        vet: true,
      },
      orderBy: [
        {
          vet: {
            is_active: 'desc',
          },
        },
        {
          vet: {
            experience: {
              sort: 'desc',
              nulls: 'last',
            },
          },
        },
      ],
      skip: offset,
    };

    if (limit > 0) selectOptions.take = limit;

    return prisma.user.findMany(selectOptions);
  }

  async updateRole(userId, newRole) {
    return prisma.user.update({
      where: { user_id: userId },
      data: { role: newRole },
    });
  }
}
