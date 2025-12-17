import express from 'express';
import userRoutes from './routes/userRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import petRoutes from './routes/petRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.use('/api/pets', petRoutes);
app.use('/api/owner', ownerRoutes);

app.use('/api/users', userRoutes);
app.use('/api', scheduleRoutes);

app.use(errorHandler);

export default app;
