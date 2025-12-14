import { BreedRepository } from '../repositories/breedRepository.js';

export class BreedService {
  constructor() {
    this.breedRepository = new BreedRepository();
  }
  async findCreateBreed(speciesId, breedName, tx) {
    const normalizedName = breedName.trim().toLowerCase();
    return await this.breedRepository.findCreateBreed(speciesId, normalizedName, tx);
  }
}
