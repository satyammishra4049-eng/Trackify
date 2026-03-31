import express from 'express';
import { 
  getTransactions, 
  addTransaction, 
  deleteTransaction,
  getMonthlySummary,
  updateTransaction,
} from '../controllers/transactionController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.use(authenticateToken); // Protect all routes below

router.route('/')
  .get(getTransactions)
  .post(addTransaction);

// Bonus requirement for summary
router.route('/summary').get(getMonthlySummary);

router.route('/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;
