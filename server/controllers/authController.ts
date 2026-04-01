import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'trackifySecretKey123';

// -------------------------------------------------------
// Rate Limiting Store (In-memory)
// -------------------------------------------------------
type RateLimitEntry = {
  count: number;
  firstAttempt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 3; // 3 attempts per window

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    rateLimitStore.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    // Reset window
    rateLimitStore.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
};

// -------------------------------------------------------
// Helper: Generate JWT token
// -------------------------------------------------------
const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// -------------------------------------------------------
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// -------------------------------------------------------
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  console.log('[Auth] Register attempt for email:', req.body?.email);

  try {
    const { name, email, password } = req.body || {};

    // --- Validation ---
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Please provide name, email and password' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check for duplicate email — email is auto-lowercased by the schema
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    // Generate OTP for email verification
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password (salt rounds = 12 for better security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with isVerified = false
    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry,
    });

    // Send verification email
    const emailSent = await sendOTPEmail(email.toLowerCase(), otp, 'email-verification');
    
    if (!emailSent) {
      // Email failed, but keep the user so they can retry verification
      // Return error with user info so frontend can show verification screen
      console.warn('[Auth] ⚠️ Failed to send verification email, but user created:', user.email);
      console.log('[DEV] 🔑 OTP for testing:', otp); // Show OTP in console for dev testing
      res.status(201).json({ 
        message: 'Registration successful! Please check your email for the verification OTP.',
        userId: user._id.toString(),
        requiresVerification: true,
        emailError: 'Email service not configured. Check server console for OTP.',
      });
      return;
    }

    console.log('[Auth] ✅ User registered and OTP sent:', user.email);

    // Return success - OTP is NEVER included in response
    res.status(201).json({
      message: 'Registration successful! Please check your email for the verification OTP.',
      userId: user._id.toString(),
      requiresVerification: true,
    });
  } catch (err: any) {
    // Handle Mongoose duplicate key error (race condition)
    if (err.code === 11000) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e: any) => e.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }
    console.error('[Auth] ❌ Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
};

// -------------------------------------------------------
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// -------------------------------------------------------
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  console.log('[Auth] Login attempt for email:', req.body?.email);

  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('[Auth] Database not connected, attempting to connect...');
      await mongoose.connect(process.env.MONGO_URI!);
    }

    const { email, password } = req.body || {};

    // --- Validation ---
    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both email and password' });
      return;
    }

    // Find user (email auto-lowercased by schema)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
      // FIX: Use generic message to prevent user enumeration attacks
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if email is verified
    if (!user.isVerified) {
      res.status(403).json({ 
        error: 'Please verify your email before logging in.',
        requiresVerification: true,
        userId: user._id.toString(),
      });
      return;
    }

    const isMatch = await bcrypt.compare(password as string, user.password);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    console.log('[Auth] ✅ Login successful:', user.email);

    res.json({
      token: generateToken(user._id.toString()),
      user: user.toJSON(),
    });
  } catch (err: any) {
    console.error('[Auth] ❌ Login error:', err.message);
    
    // Check if it's a database connection error
    if (err.message && err.message.includes('MongoNetworkError')) {
      res.status(503).json({ 
        error: 'Database connection issue. Please try again in a moment.',
        retry: true 
      });
      return;
    }
    
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
};

// -------------------------------------------------------
// Helper: Generate 6-digit OTP
// -------------------------------------------------------
const generateOtp = (): string => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// -------------------------------------------------------
// @desc    Forgot Password - Send OTP via Email
// @route   POST /api/auth/forgot-password
// @access  Public
// -------------------------------------------------------
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body || {};
    
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Please provide a valid email' });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    
    // Check rate limit
    if (!checkRateLimit(emailLower)) {
      res.status(429).json({ error: 'Too many attempts. Please try again after 5 minutes.' });
      return;
    }
    
    // Find user
    const user = await User.findOne({ email: emailLower });
    
    if (!user) {
      // Don't reveal if user exists for security
      res.status(200).json({ message: 'If an account exists, a password reset OTP has been sent.' });
      return;
    }

    // Check if email is verified
    if (!user.isVerified) {
      res.status(403).json({ error: 'Please verify your email before requesting a password reset.' });
      return;
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send email
    const emailSent = await sendOTPEmail(emailLower, otp, 'forgot-password');
    
    if (!emailSent) {
      res.status(500).json({ error: 'Failed to send email. Please try again later.' });
      return;
    }

    console.log('[Auth] ✅ Password reset OTP sent to:', user.email);

    // NEVER return OTP in response - OTP is sent via email only
    res.status(200).json({ 
      message: 'If an account exists, a password reset OTP has been sent to your email.' 
    });
  } catch (err: any) {
    console.error('[Auth] ❌ Forgot password error:', err?.message || err);
    res.status(500).json({ error: 'Server error during forgot password. Please try again.' });
  }
};

// -------------------------------------------------------
// @desc    Verify Email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
// -------------------------------------------------------
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body || {};

    // Validation
    if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
      res.status(400).json({ error: 'Please provide email and OTP' });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const otpValue = otp.trim();

    if (!/^\d{6}$/.test(otpValue)) {
      res.status(400).json({ error: 'OTP must be a 6-digit number' });
      return;
    }

    // Find user with OTP fields
    const user = await User.findOne({ email: emailLower }).select('+otp +otpExpiry');
    
    if (!user) {
      res.status(400).json({ error: 'Invalid email or OTP' });
      return;
    }

    // Check if OTP exists
    if (!user.otp) {
      res.status(400).json({ error: 'No OTP found. Please request a new one.' });
      return;
    }

    // Check OTP expiry
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Validate OTP
    if (user.otp !== otpValue) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    // Mark email as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(emailLower, user.name);

    console.log('[Auth] ✅ Email verified for:', user.email);

    // Return token and user (now they can login)
    res.status(200).json({
      message: 'Email verified successfully!',
      token: generateToken(user._id.toString()),
      user: user.toJSON(),
    });
  } catch (err: any) {
    console.error('[Auth] ❌ Email verification error:', err?.message || err);
    res.status(500).json({ error: 'Server error during email verification. Please try again.' });
  }
};

// -------------------------------------------------------
// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
// -------------------------------------------------------
// -------------------------------------------------------
// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
// -------------------------------------------------------
export const resendVerificationOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Please provide a valid email' });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    
    // Check rate limit
    if (!checkRateLimit(emailLower)) {
      res.status(429).json({ error: 'Too many attempts. Please try again after 5 minutes.' });
      return;
    }
    
    const user = await User.findOne({ email: emailLower });
    
    if (!user) {
      // Don't reveal if user exists
      res.status(200).json({ message: 'If an account exists, a new OTP has been sent.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: 'Email is already verified. Please login.' });
      return;
    }

    // Generate new OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send email
    const emailSent = await sendOTPEmail(emailLower, otp, 'email-verification');
    
    if (!emailSent) {
      res.status(500).json({ error: 'Failed to send email. Please check your email configuration.' });
      return;
    }

    console.log('[Auth] ✅ Verification OTP resent to:', user.email);

    res.status(200).json({ 
      message: 'A new OTP has been sent to your email.' 
    });
  } catch (err: any) {
    console.error('[Auth] ❌ Resend OTP error:', err?.message || err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body || {};
    
    // Validation
    if (!email || !otp || !newPassword || typeof email !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Please provide email, OTP and new password' });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const otpValue = otp.trim();

    if (!/^\d{6}$/.test(otpValue)) {
      res.status(400).json({ error: 'OTP must be a 6-digit number' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Find user with OTP
    const user = await User.findOne({ email: emailLower }).select('+otp +otpExpiry');
    
    if (!user) {
      res.status(400).json({ error: 'Invalid email or OTP' });
      return;
    }

    // Check if OTP exists
    if (!user.otp) {
      res.status(400).json({ error: 'No OTP found. Please request a new one.' });
      return;
    }

    // Check OTP expiry
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Validate OTP
    if (user.otp !== otpValue) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log('[Auth] ✅ Password reset successful for:', user.email);

    res.status(200).json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (err: any) {
    console.error('[Auth] ❌ Reset password error:', err?.message || err);
    res.status(500).json({ error: 'Server error during password reset. Please try again.' });
  }
};
