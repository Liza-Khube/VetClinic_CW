import { PetService } from '../services/petService.js';

const petService = new PetService();

export const createPet = async (req, res, next) => {
  try {
    const ownerId = req.user?.user_id;
    if (!ownerId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { name, dateOfBirth, gender, speciesName, breedName } = req.body;
    if (!name || !dateOfBirth || !gender || !speciesName || !breedName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (gender !== 'male' && gender !== 'female') {
      return res.status(400).json({ error: "Gender must be 'male' or 'female'" });
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
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
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
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
