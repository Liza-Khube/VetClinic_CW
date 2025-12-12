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

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const createVet = async (req, res, next) => {
  try {
    const { vetEmail, vetPassword, name, surname, experience, specialisation } =
      req.body;
    const adminId = req.user.user_id;

    const vet = await userService.createVetAccount(
      adminId,
      vetEmail,
      vetPassword,
      name,
      surname,
      experience,
      specialisation
    );

    res.status(201).json({
      message: 'Vet account was created',
      user: {
        user_id: vet.user_id,
        email: vet.email,
        role: vet.role,
        name: vet.name,
        surname: vet.surname,
      },
    });
  } catch (err) {
    next(err);
  }
};
