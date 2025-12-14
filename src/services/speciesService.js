import prisma from '../prismaClient.js';

export class SpeciesService {
  async findCreateSpecies(speciesName, tx = prisma) {
    const normalizedName = speciesName.trim().toLowerCase();

    return await tx.species.upsert({
      where: { name: normalizedName },
      update: {},
      create: { name: normalizedName },
    });
  }
}
