import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './server/routes/authRoutes';
import budgetRoutes from './server/routes/budgetRoutes';
import transactionRoutes from './server/routes/transactionRoutes';
import userRoutes from './server/routes/userRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api', (_req, res) => {
  res.json({ message: 'API Running' });
});

app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database not connected' });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('SERVER ERROR:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ message: 'Server failed', error: message });
});

export default app;

