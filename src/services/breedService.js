import prisma from '../prismaClient.js';

export class BreedService {
  async findCreateBreed(speciesId, breedName, tx = prisma) {
    const normalizedName = breedName.trim().toLowerCase();

    return await tx.breed.upsert({
      where: {
        species_id_name: {
          species_id: speciesId,
          name: normalizedName,
        },
      },
      update: {},
      create: {
        name: normalizedName,
        species_id: speciesId,
      },
    });
  }
}
