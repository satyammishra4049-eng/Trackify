import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Budget from '../models/Budget';

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const budgets = await Budget.find({ userId: req.user?._id }).sort({ month: -1, category: 1 });
    res.json(budgets);
  } catch (error: any) {
    console.error('[Budgets] Get error:', error?.message || error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

export const addBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, amount, month } = req.body || {};

    if (!category || amount === undefined || !month) {
      res.status(400).json({ error: 'Please provide category, amount and month' });
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Amount must be a valid positive number' });
      return;
    }

    const budget = await Budget.create({
      userId: req.user?._id,
      category: String(category).trim(),
      amount: parsedAmount,
      month: String(month).trim(),
    });

    res.status(201).json(budget);
  } catch (error: any) {
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }
    console.error('[Budgets] Add error:', error?.message || error);
    res.status(500).json({ error: 'Failed to add budget' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);

    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (budget.userId.toString() !== req.user?._id?.toString()) {
      res.status(403).json({ error: 'Not authorized to delete this budget' });
      return;
    }

    await budget.deleteOne();
    res.json({ id, message: 'Budget deleted successfully' });
  } catch (error: any) {
    console.error('[Budgets] Delete error:', error?.message || error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

