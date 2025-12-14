import express from 'express';
import userRoutes from './routes/userRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/owner', ownerRoutes);

app.use(errorHandler);

export default app;
