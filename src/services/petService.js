import prisma from '../prismaClient.js';
import { SpeciesService } from './speciesService.js';
import { BreedService } from './breedService.js';
import { PetRepository } from '../repositories/petRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { PermissionDeniedError, ConflictError } from './userService.js';

const speciesService = new SpeciesService();
const breedService = new BreedService();

export class PetService {
  constructor() {
    this.petRepository = new PetRepository();
    this.userRepository = new UserRepository();
  }
  async createPet(ownerId, petData) {
    const { name, dateOfBirth, gender, speciesName, breedName } = petData;
    return await prisma.$transaction(async (tx) => {
      const owner = await this.userRepository.findById(ownerId);

      if (!owner || owner.role !== 'owner') {
        throw new PermissionDeniedError('Only owner can create pet');
      }
      if (owner.is_deleted) {
        throw new PermissionDeniedError('User account is deleted');
      }

      const existingPet = await this.petRepository.findPetByNameAndDate(
        name.trim(),
        dateOfBirth,
        ownerId
      );
      if (existingPet) {
        throw new ConflictError('Pet already exists');
      }

      const checkedBreedName =
        breedName && breed.trim() !== '' ? breedName : 'unpedigreed';

      const species = await speciesService.findCreateSpecies(speciesName, tx);
      const breed = await breedService.findCreateBreed(
        species.species_id,
        checkedBreedName,
        tx
      );

      const newPet = await this.petRepository.createPet(
        name,
        dateOfBirth,
        gender,
        breed,
        ownerId,
        tx
      );
      return newPet;
    });
  }

  async viewPetsOwner(owner_user_id) {
    try {
      const [pets, total] = await prisma.$transaction(async (tx) => [
        await this.petRepository.findPetsOwner(owner_user_id, tx),
        await this.petRepository.countPetsOwner(owner_user_id, tx),
      ]);
      return { pets, total };
    } catch (error) {
      throw new Error(`Fail to view owner's pets: ${error.message}`);
    }
  }

  async viewAllPets() {
    try {
      return await this.petRepository.findAllPets();
    } catch (error) {
      throw new Error(`Fail to view all pets: ${error.message}`);
    }
  }

  async viewOwnerPetReport(minPetsAmount) {
    let minAmount = parseInt(minPetsAmount, 10);

    if (isNaN(minAmount)) {
      minAmount = 0;
    }

    try {
      return await this.petRepository.findOwnerPetReport(minAmount);
    } catch (error) {
      throw new Error(`Fail to view owners and their pets: ${error.message}`);
    }
  }
}
