import express from 'express';
import userRoutes from './routes/userRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import petRoutes from './routes/petRoutes.js';

const app = express();

app.use(express.json());

app.use('/api/pets', petRoutes);
app.use('/api/users', userRoutes);
app.use('/api/owner', ownerRoutes);

app.use(errorHandler);

export default app;
