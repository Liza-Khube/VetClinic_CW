import { PetService } from '../services/petService.js';

const petService = new PetService();

export const createPet = async (req, res, next) => {
  try {
    const ownerId = req.user?.user_id;
    if (!ownerId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { name, dateOfBirth, gender, speciesName, breedName } = req.body;
    if (!name || !dateOfBirth || !gender || !speciesName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (gender !== 'male' && gender !== 'female') {
      return res.status(400).json({ error: "Gender must be 'male' or 'female'" });
    }

    const birthDateObj = new Date(dateOfBirth);
    const now = new Date();

    if (isNaN(birthDateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (birthDateObj > now) {
      return res.status(400).json({ error: 'Date of birth cannot be in the future' });
    }

    const newPet = await petService.createPet(ownerId, {
      name,
      dateOfBirth,
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
    const data = await petService.viewOwnerPetReport(min_pets);

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
