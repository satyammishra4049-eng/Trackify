import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/authMiddleware';

// -------------------------------------------------------
// @desc    Get current user
// @route   GET /api/users
// @access  Private
// -------------------------------------------------------
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: user.toJSON() });
  } catch (error: any) {
    console.error('[User] Get current user error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// -------------------------------------------------------
// @desc    Update user profile (name, email, avatar)
// @route   PUT /api/users/profile
// @access  Private
// -------------------------------------------------------
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('[User] Profile update for:', req.user?.email);
  try {
    const { name, email, avatarUrl } = req.body;

    // FIX: Validate at least one field is provided
    if (!name && !email && avatarUrl === undefined) {
      res.status(400).json({ error: 'Please provide at least one field to update' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    const updatedUser = await user.save();
    console.log('[User] ✅ Profile updated for:', updatedUser.email);

    res.json({ user: updatedUser.toJSON() });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'This email is already in use by another account' });
      return;
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }
    console.error('[User] ❌ Profile update error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// -------------------------------------------------------
// @desc    Change user password
// @route   PUT /api/user/password
// @access  Private
// -------------------------------------------------------
export const updateUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Please provide current and new password' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }
    if (currentPassword === newPassword) {
      res.status(400).json({ error: 'Invalid password' });
      return;
    }

    // Explicitly select password field (it's excluded by default in schema)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // DEBUG: Check if password exists
    if (!user.password) {
      console.error('[User] ❌ User password hash is missing from DB');
      res.status(500).json({ error: 'Password data corrupted. Please contact support.' });
      return;
    }

    // Compare passwords
    console.log('[User] 🔐 Checking current password...');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      console.log('[User] ❌ Current password mismatch for:', user.email);
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Hash new password
    console.log('[User] 🔐 Hashing new password...');
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log('[User] ✅ Password changed for:', user.email);
    res.json({ message: 'Update successful' });
  } catch (error: any) {
    console.error('[User] ❌ Password change error:', error.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// -------------------------------------------------------
// @desc    Export user data for PDF/reports
// @route   GET /api/users/export
// @access  Private
// -------------------------------------------------------
export const exportUserData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currency = 'INR' } = req.query;
    
    const user = await User.findById(req.user._id).select('-password');
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });

    res.json({
      user,
      transactions,
      budgets: [],
      currency: currency as string,
      exportedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[User] ❌ Export error:', error.message);
    res.status(500).json({ error: 'Failed to export data' });
  }
};
