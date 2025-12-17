import { SpeciesRepository } from '../repositories/speciesRepository.js';

export class SpeciesService {
  constructor() {
    this.speciesRepository = new SpeciesRepository();
  }
  async findCreateSpecies(speciesName, tx) {
    const normalizedName = speciesName.trim().toLowerCase();

    return await this.speciesRepository.findCreateSpecies(normalizedName, tx);
  }
}
