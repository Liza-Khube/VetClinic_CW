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

    return prisma.pet.findFirst({
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

  async findOwnerPetReport(minPetsAmount) {
    const result = await prisma.$queryRaw`
      WITH owner_pet_stats AS (
        SELECT 
          o.user_id,
          u.name || ' ' || u.surname AS owner_name,
          u.email,
          u.phone,
          COUNT(p.pet_id) AS pet_count
        FROM owner o
        JOIN "user" u ON o.user_id = u.user_id
        JOIN pet p ON o.user_id = p.owner_user_id
        WHERE p.is_deleted = FALSE AND u.is_deleted = FALSE
        GROUP BY o.user_id, u.name, u.surname, u.email, u.phone
        HAVING COUNT(p.pet_id) > ${minPetsAmount}
      ),
      pet_details AS (
        SELECT 
          p.owner_user_id,
          STRING_AGG(p.name || ' (' || b.name || ' ' || s.name || ')', ', ' ORDER BY p.name) AS pet_with_breeds
        FROM pet p
        JOIN breed b ON p.breed_id = b.breed_id
        JOIN species s ON b.species_id = s.species_id
        WHERE p.is_deleted = FALSE
        GROUP BY p.owner_user_id
      )
      SELECT 
        ops.owner_name,
        ops.email,
        ops.phone,
        ops.pet_count,
        pd.pet_with_breeds
      FROM owner_pet_stats ops
      LEFT JOIN pet_details pd ON ops.user_id = pd.owner_user_id
      ORDER BY ops.pet_count DESC;
    `;
    return result.map((row) => ({
      ...row,
      pet_count: Number(row.pet_count),
    }));
  }
}
