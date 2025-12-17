import prisma from '../prismaClient.js';

export class BreedRepository {
  async findCreateBreed(speciesId, normalizedName, tx = prisma) {
    return tx.breed.upsert({
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
