import express from 'express';
import { getBudgets, addBudget, deleteBudget } from '../controllers/budgetController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.use(authenticateToken);

router
  .route('/')
  .get(getBudgets)
  .post(addBudget);

router.route('/:id').delete(deleteBudget);

export default router;

