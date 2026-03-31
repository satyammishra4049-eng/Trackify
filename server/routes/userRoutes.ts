import express from 'express';
import { 
  getCurrentUser,
  updateUserProfile, 
  updateUserPassword, 
  exportUserData 
} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateUserProfile);
router.put('/password', authenticateToken, updateUserPassword);
router.get('/export', authenticateToken, exportUserData);

export default router;
