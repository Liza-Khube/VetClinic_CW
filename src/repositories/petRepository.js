import prisma from '../prismaClient.js';

export class PetRepository {
  async createPet(name, dateOfBirth, gender, breed, owner_user_id, tx = prisma) {
    const newPet = await tx.pet.create({
      data: {
        name,
        date_of_birth: new Date(dateOfBirth),
        gender,
        breed_id: breed.breed_id,
        owner_user_id,
      },
      include: {
        breed: {
          include: { species: true },
        },
      },
    });
    return newPet;
  }

  async findPetByNameAndDate(name, dateOfBirth, ownerId = null) {
    const whereCondition = {
      name,
      date_of_birth: new Date(dateOfBirth),
      is_deleted: false,
    };

    if (ownerId) {
      whereCondition.owner_user_id = ownerId;
    }

    return prisma.pet.findUnique({
      where: whereCondition,
      include: {
        breed: {
          include: { species: true },
        },
      },
    });
  }

  async findPetsOwner(owner_user_id, tx = prisma) {
    return tx.pet.findMany({
      where: {
        owner_user_id,
        is_deleted: false,
      },
      include: {
        breed: {
          include: { species: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async countPetsOwner(owner_user_id, tx = prisma) {
    return tx.pet.count({
      where: {
        owner_user_id,
        is_deleted: false,
      },
    });
  }

  async findAllPets() {
    return await prisma.pet.findMany({
      include: {
        breed: {
          include: { species: true },
        },
      },
    });
  }
}
