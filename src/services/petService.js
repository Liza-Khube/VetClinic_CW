import prisma from '../prismaClient.js';
import { SpeciesService } from './speciesService.js';
import { BreedService } from './breedService.js';

const speciesService = new SpeciesService();
const breedService = new BreedService();

export class PetService {
  async createPet(ownerId, petData) {
    const { name, dateOfBirth, gender, speciesName, breedName } = petData;
    try {
      const createdPet = await prisma.$transaction(async (tx) => {
        const owner = await tx.user.findUnique({
          where: { user_id: ownerId },
          include: { owner: true },
        });

        if (!owner) throw new Error('User not found');
        if (owner.is_deleted) throw new Error('User is deleted');
        if (owner.role !== 'owner') throw new Error('Need owner rights');

        const species = await speciesService.findCreateSpecies(speciesName, tx);
        const breed = await breedService.findCreateBreed(
          species.species_id,
          breedName,
          tx
        );

        const newPet = await tx.pet.create({
          data: {
            name: name,
            date_of_birth: new Date(dateOfBirth),
            gender: gender,
            breed_id: breed.breed_id,
            owner_user_id: ownerId,
          },
          include: {
            breed: {
              include: { species: true },
            },
          },
        });
        return newPet;
      });
      return createdPet;
    } catch (error) {
      throw new Error(`Fail to add pet: ${error.message}`);
    }
  }

  async viewPetsOwner(owner_user_id) {
    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        where: {
          owner_user_id,
          is_deleted: false,
        },
        include: {
          breed: {
            include: { species: true },
          },
        },
      }),
      prisma.pet.count({
        where: {
          owner_user_id,
          is_deleted: false,
        },
      }),
    ]);
    return { pets, total };
  }
}
