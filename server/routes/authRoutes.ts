import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyEmail,
  resetPassword,
  resendVerificationOTP,
} from '../controllers/authController';
import { sendTestEmail } from '../services/emailService';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.post('/forgot-password', forgotPassword);
router.post('/verify-email', verifyEmail);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendVerificationOTP);

// Test email route
router.get('/test-email', async (_req, res) => {
  console.log('[API] 🧪 Test email route called');
  const result = await sendTestEmail();
  
  if (result.success) {
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      provider: result.provider,
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error,
    });
  }
});

export default router;
