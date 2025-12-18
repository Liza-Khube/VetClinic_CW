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
        breedName && breedName.trim() !== '' ? breedName : 'unpedigreed';

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

  async viewPetsOwner(ownerId) {
    try {
      const [pets, total] = await prisma.$transaction(async (tx) => [
        await this.petRepository.findPetsOwner(ownerId, tx),
        await this.petRepository.countPetsOwner(ownerId, tx),
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

  async updatePet(userId, petId, updateData) {
    const { name, dateOfBirth, gender, speciesName, breedName } = updateData;
    return await prisma.$transaction(async (tx) => {
      const pet = await this.petRepository.findPetById(petId);

      if (!pet) {
        throw new Error('Pet not found');
      }
      if (pet.owner_user_id !== userId) {
        throw new PermissionDeniedError('User can only update their own pets');
      }
      if (pet.is_deleted) {
        throw new Error('Pet is deleted');
      }

      const dataToUpdate = {};
      if (name) dataToUpdate.name = name.trim();
      if (dateOfBirth) dataToUpdate.date_of_birth = new Date(dateOfBirth);
      if (gender) dataToUpdate.gender = gender;
      if (breedName || speciesName) {
        const targetSpeciesName = speciesName || pet.breed.species.name;

        let targetBreedName;
        if (breedName !== undefined) {
          targetBreedName =
            breedName && breedName.trim() !== '' ? breedName : 'unpedigreed';
        } else {
          targetBreedName = pet.breed.name;
        }

        const species = await speciesService.findCreateSpecies(targetSpeciesName, tx);
        const breed = await breedService.findCreateBreed(
          species.species_id,
          targetBreedName,
          tx
        );

        dataToUpdate.breed_id = breed.breed_id;
      }

      return await this.petRepository.updatePet(petId, dataToUpdate, tx);
    });
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
