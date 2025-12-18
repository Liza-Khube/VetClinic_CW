import { UserService } from '../services/userService.js';

const userService = new UserService();

export const registerUser = async (req, res, next) => {
  try {
    const { email, password, name, surname, phone } = req.body;

    const user = await userService.registerOwner(
      email,
      password,
      name,
      surname,
      phone
    );

    res.status(201).json({
      message: 'Owner registration succeded',
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        surname: user.surname,
        phone: user.phone || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createVet = async (req, res, next) => {
  try {
    const {
      vetEmail,
      vetPassword,
      name,
      surname,
      phone,
      experience,
      specialisation,
    } = req.body;
    const adminId = req.user.user_id;

    const vet = await userService.createVetAccount(
      adminId,
      vetEmail,
      vetPassword,
      name,
      surname,
      specialisation,
      phone,
      experience
    );

    res.status(201).json({
      message: 'Vet account was created',
      user: {
        user_id: vet.user_id,
        email: vet.email,
        role: vet.role,
        name: vet.name,
        surname: vet.surname,
        phone: vet.phone || null,
        experience: vet.experience || null,
        specialisation: vet.specialisation,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getVets = async (req, res, next) => {
  try {
    const { minExperience, isActive, limit, offset } = req.query;

    const minExp = parseInt(minExperience) || 0;

    const isActiveStatus =
      isActive !== undefined ? isActive.toLowerCase() === 'true' : undefined;
    const amountLimit = parseInt(limit) || null;
    const pageOffset = parseInt(offset) || 0;

    const result = await userService.getVetsDetails(
      minExp,
      isActiveStatus,
      amountLimit,
      pageOffset
    );

    res.status(200).json({ message: 'Vet list is shown', ...result });
  } catch (err) {
    next(err);
  }
};

export const updateVetActiveStatus = async (req, res, next) => {
  try {
    const { vetUserId } = req.params;
    const { lastKnownUpdate } = req.body;

    if (!lastKnownUpdate) {
      return res.status(400).json({
        message: 'The lastKnownUpdate timestamp is required',
      });
    }

    const result = await userService.toggleVetActiveness(
      parseInt(vetUserId),
      lastKnownUpdate
    );

    return res.status(200).json({
      message: `Vet status successfully changed to ${
        result.is_active ? 'active' : 'inactive'
      }`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
