import prisma from '../prismaClient.js';

export class SpeciesRepository {
  async findCreateSpecies(normalizedName, tx = prisma) {
    return tx.species.upsert({
      where: { name: normalizedName },
      update: {},
      create: { name: normalizedName },
    });
  }
}
