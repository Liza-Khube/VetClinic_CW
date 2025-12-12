import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository.js';
const JWT_SECRET = process.env.JWT_SECRET;
const userRepository = new UserRepository();

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({
      message: 'Authentication failed: Missing or invalid token format.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.userId;
    const user = await userRepository.findById(userId);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .send({ message: 'Authentication failed: Invalid or expired token.' });
    }

    return res
      .status(500)
      .send({ message: 'Internal server error during authentication.' });
  }
};

export const authorize = (requiredRole) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({ message: 'Authentication required.' });
  }

  if (req.user.role !== requiredRole) {
    return res.status(403).send({
      message: `Forbidden: Requires role ${requiredRole}`,
      userRole: req.user.role,
    });
  }

  next();
};
