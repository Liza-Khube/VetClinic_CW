import { PetService } from '../services/petService.js';

const petService = new PetService();

export const createPet = async (req, res, next) => {
  try {
    const ownerId = req.user?.user_id;
    if (!ownerId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    let { name, dateOfBirth, gender, speciesName, breedName } = req.body;
    if (!name || !dateOfBirth || !gender || !speciesName) {
      return res.status(400).json({
        error: 'All fields (name, dateOfBirth, gender, speciesName) are required',
      });
    }

    name = name.trim();
    speciesName = speciesName.trim();
    if (breedName) breedName = breedName.trim();

    if (gender !== 'male' && gender !== 'female') {
      return res.status(400).json({ error: "Gender must be 'male' or 'female'" });
    }

    const parsedDate = new Date(dateOfBirth);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (parsedDate > new Date()) {
      return res.status(400).json({ error: 'Date of birth cannot be in the future' });
    }

    const newPet = await petService.createPet(ownerId, {
      name,
      dateOfBirth: parsedDate,
      gender,
      speciesName,
      breedName,
    });
    res.status(200).json({
      message: 'Pet created successfully',
      pet: newPet,
    });
  } catch (err) {
    next(err);
  }
};

export const viewPetsOwner = async (req, res, next) => {
  try {
    const ownerId = req.user?.user_id;
    if (!ownerId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await petService.viewPetsOwner(ownerId);
    res.status(200).json({ message: `Pet list of owner ${ownerId} is shown`, ...result });
  } catch (err) {
    next(err);
  }
};

export const viewAllPets = async (req, res, next) => {
  try {
    const result = await petService.viewAllPets();
    res.status(200).json({ message: `Pet list is shown`, data: result });
  } catch (err) {
    next(err);
  }
};

export const viewOwnerPetReport = async (req, res) => {
  try {
    const { min_pets } = req.query;
    let minAmount = parseInt(min_pets, 10);
    if (isNaN(minAmount)) {
      minAmount = 0;
    }

    const data = await petService.viewOwnerPetReport(minAmount);

    res.status(200).json({
      message: `Statistic is shown`,
      data: data,
    });
  } catch (err) {
    console.error('Error in getPetsOwnerStat:', err);
    res.status(500).json({
      message: 'Error while fetching pet statistic',
    });
  }
};

export const updatePet = async (req, res, next) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const petId = parseInt(req.params.id, 10);
    if (isNaN(petId)) {
      return res.status(400).json({ error: 'Invalid pet ID format' });
    }

    let { name, dateOfBirth, gender, speciesName, breedName, is_deleted } = req.body;
    if (is_deleted !== undefined) {
      return res.status(400).json({
        error: 'Cannot delete pet via update route',
      });
    }
    if (name) name = name.trim();
    if (breedName) breedName = breedName.trim();
    if (speciesName) speciesName = speciesName.trim();
    if (dateOfBirth) dateOfBirth = new Date(dateOfBirth);

    if (gender && gender !== 'male' && gender !== 'female') {
      return res.status(400).json({ error: "Gender must be 'male' or 'female'" });
    }
    let parsedDate = undefined;
    if (dateOfBirth) {
      parsedDate = new Date(dateOfBirth);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      if (parsedDate > new Date()) {
        return res.status(400).json({ error: 'Date of birth cannot be in the future' });
      }
    }
    const updatedPet = await petService.updatePet(userId, petId, {
      name,
      dateOfBirth: parsedDate,
      gender,
      speciesName,
      breedName,
    });
    res.status(200).json({
      message: 'Pet updated successfully',
      pet: updatedPet,
    });
  } catch (err) {
    next(err);
  }
};
