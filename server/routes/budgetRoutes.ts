import express from 'express';
import { getBudgets, addBudget, deleteBudget } from '../controllers/budgetController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router
  .route('/')
  .get(getBudgets)
  .post(addBudget);

router.route('/:id').delete(deleteBudget);

export default router;

