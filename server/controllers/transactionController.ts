import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Transaction from '../models/Transaction';

// -------------------------------------------------------
// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
// -------------------------------------------------------
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, startDate, endDate, type } = req.query;
    const query: any = { userId: req.user._id };

    if (category) query.category = category;
    if (type && (type === 'income' || type === 'expense')) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error: any) {
    console.error('[Transaction] Get error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// -------------------------------------------------------
// @desc    Add new transaction
// @route   POST /api/transactions
// @access  Private
// -------------------------------------------------------
export const addTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, type, category, date, description } = req.body;

    // FIX: Added validation that was completely missing
    if (!amount || !type || !category || !date) {
      res.status(400).json({ error: 'Please provide amount, type, category and date' });
      return;
    }
    if (amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }
    if (!['income', 'expense'].includes(type)) {
      res.status(400).json({ error: 'Type must be income or expense' });
      return;
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: Number(amount),
      type,
      category: category.trim(),
      date: new Date(date),
      description: description?.trim(),
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }
    console.error('[Transaction] Add error:', error.message);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
};

// -------------------------------------------------------
// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
// -------------------------------------------------------
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    if (transaction.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ error: 'Not authorized to delete this transaction' });
      return;
    }

    await transaction.deleteOne();
    res.json({ id: req.params.id, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('[Transaction] Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// -------------------------------------------------------
// @desc    Update an existing transaction
// @route   PUT /api/transactions/:id
// @access  Private
// -------------------------------------------------------
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, type, category, date, description } = req.body || {};

    if (!amount || !type || !category || !date) {
      res.status(400).json({ error: 'Please provide amount, type, category and date' });
      return;
    }
    if (Number(amount) <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }
    if (!['income', 'expense'].includes(type)) {
      res.status(400).json({ error: 'Type must be income or expense' });
      return;
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    if (transaction.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ error: 'Not authorized to update this transaction' });
      return;
    }

    transaction.amount = Number(amount);
    transaction.type = type;
    transaction.category = String(category).trim();
    transaction.date = new Date(date);
    transaction.description = description ? String(description).trim() : '';

    await transaction.save();
    res.json(transaction);
  } catch (error: any) {
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }
    console.error('[Transaction] Update error:', error?.message || error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// -------------------------------------------------------
// @desc    Get monthly summary
// @route   GET /api/transactions/summary
// @access  Private
// -------------------------------------------------------
export const getMonthlySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    res.json({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (error: any) {
    console.error('[Transaction] Summary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
};
