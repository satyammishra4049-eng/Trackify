import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { authAPI } from "../services/api";
import { TrendingUp, Mail, Lock, User as UserIcon, KeyRound, RefreshCw, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const data = await authAPI.forgotPassword(email);
      toast.success(data.message);
      setForgotStep(2);
      setTimer(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setIsSubmitting(true);
    try {
      // For forgot password, we just verify the OTP exists and proceed to reset
      // The actual validation happens during reset-password
      toast.success("OTP entered! Please set your new password.");
      setForgotStep(3);
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authAPI.resetPassword(email, otp, newPassword);
      toast.success("Password reset successfully! You can now sign in.");
      setIsForgotMode(false);
      setForgotStep(1);
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await authAPI.login(email, password);
      if (rememberMe) {
        localStorage.setItem("remembered_email", email);
      } else {
        localStorage.removeItem("remembered_email");
      }
      login(data.token, data.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      // Check if email needs verification
      if (err.message?.includes('verify your email') || err.requiresVerification) {
        toast.error("Please verify your email before logging in.");
        setNeedsVerification(true);
      } else {
        toast.error(err.message || "Invalid credentials");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyFromLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyOtp || verifyOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await authAPI.verifyEmail(email, verifyOtp);
      login(data.token, data.user);
      toast.success("Email verified successfully! Welcome to Trackify!");
      setNeedsVerification(false);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendFromLogin = async () => {
    setIsSubmitting(true);
    try {
      const data = await authAPI.resendOTP(email);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex overflow-hidden transition-colors">
      <div className="w-full flex items-center justify-center p-8 bg-slate-50 lg:bg-white dark:bg-slate-950 transition-colors relative">
        <Toaster position="top-center" richColors />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-100/50 dark:bg-rose-900/10 rounded-full blur-3xl -ml-32 -mb-32 animate-pulse-slow" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full relative z-10"
        >
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4">
              <TrendingUp size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trackify</h1>
          </div>

          <motion.div variants={itemVariants} className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {needsVerification 
                ? "Verify Email" 
                : isForgotMode 
                  ? (forgotStep === 1 ? "Reset password" : forgotStep === 2 ? "Verify OTP" : "New Password") 
                  : "Welcome back"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {needsVerification
                ? `We've sent a verification code to ${email}. Please enter it below to verify your email.`
                : isForgotMode 
                  ? (forgotStep === 1 
                      ? "Enter your email to receive a 6-digit OTP." 
                      : forgotStep === 2 
                        ? `We've sent a code to ${email}` 
                        : "Create a strong new password for your account.") 
                  : "Please enter your details to sign in."}
            </p>
          </motion.div>

          <form 
            onSubmit={
              needsVerification
                ? handleVerifyFromLogin
                : isForgotMode 
                  ? (forgotStep === 1 ? handleRequestOtp : forgotStep === 2 ? handleVerifyOtp : handleResetPassword) 
                  : handleSubmit
            } 
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {needsVerification ? (
                <motion.div
                  key="email-verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 text-center block">Enter 6-digit Verification Code</label>
                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={verifyOtp}
                          onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ""))}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white text-center text-2xl tracking-[0.5em] font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700"
                          placeholder="000000"
                        />
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleResendFromLogin}
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 disabled:text-slate-400 transition-colors"
                      >
                        <RefreshCw size={16} className={isSubmitting ? "animate-spin" : ""} />
                        Resend OTP
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : isForgotMode ? (
                <motion.div
                  key={`forgot-step-${forgotStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {forgotStep === 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>
                  )}

                  {forgotStep === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 text-center block">Enter 6-digit Code</label>
                        <div className="relative group">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white text-center text-2xl tracking-[0.5em] font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder="000000"
                          />
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          disabled={timer > 0 || isSubmitting}
                          onClick={handleRequestOtp}
                          className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 disabled:text-slate-400 transition-colors"
                        >
                          <RefreshCw size={16} className={isSubmitting ? "animate-spin" : ""} />
                          {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  {forgotStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">New Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                          >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirm New Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsForgotMode(true);
                          setForgotStep(1);
                        }}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-1">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="remember-me" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                      Remember Me
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <RefreshCw size={20} className="animate-spin" />}
              {isSubmitting 
                ? (needsVerification ? "Verifying..." : isForgotMode ? "Processing..." : "Signing In...")
                : (needsVerification ? "Verify Email" : isForgotMode 
                  ? (forgotStep === 1 ? "Send Reset Link" : forgotStep === 2 ? "Verify OTP" : "Reset Password") 
                  : "Sign In")}
            </motion.button>

            {(isForgotMode || needsVerification) && (
              <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => {
                  if (needsVerification) {
                    setNeedsVerification(false);
                  } else if (isForgotMode) {
                    if (forgotStep > 1) {
                      setForgotStep(forgotStep - 1);
                    } else {
                      setIsForgotMode(false);
                    }
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <ArrowLeft size={18} />
                {needsVerification ? "Back to Sign In" : forgotStep === 1 ? "Back to Sign In" : "Back"}
              </motion.button>
            )}
          </form>

          <motion.p variants={itemVariants} className="mt-10 text-center text-slate-500 dark:text-slate-400 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4">
              Create an account
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const data = await authAPI.register(name, email, password);
      // Check if email verification is required
      if (data.requiresVerification) {
        setRequiresVerification(true);
        toast.success("Registration successful! Please check your email for the verification OTP.");
      } else {
        // Legacy flow - auto login
        login(data.token, data.user);
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
      toast.error(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await authAPI.verifyEmail(email, otp);
      login(data.token, data.user);
      toast.success("Email verified successfully! Welcome to Trackify!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsSubmitting(true);
    try {
      const data = await authAPI.resendOTP(email);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex overflow-hidden transition-colors">
      <div className="w-full flex items-center justify-center p-8 bg-slate-50 lg:bg-white dark:bg-slate-950 transition-colors relative">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-100/50 dark:bg-indigo-900/10 rounded-full blur-3xl -ml-32 -mt-32 animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-100/50 dark:bg-rose-900/10 rounded-full blur-3xl -mr-32 -mb-32 animate-pulse-slow" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full relative z-10"
        >
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4">
              <TrendingUp size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trackify</h1>
          </div>

          <motion.div variants={itemVariants} className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {requiresVerification ? "Verify Email" : "Create account"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {requiresVerification 
                ? `We've sent a verification code to ${email}` 
                : "Join us and start managing your wealth."}
            </p>
          </motion.div>

          <form onSubmit={requiresVerification ? handleVerifyEmail : handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full" />
                {error}
              </motion.div>
            )}

            {requiresVerification ? (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 text-center block">Enter 6-digit Verification Code</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white text-center text-2xl tracking-[0.5em] font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      placeholder="000000"
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleResendOTP}
                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 disabled:text-slate-400 transition-colors"
                  >
                    <RefreshCw size={16} className={isSubmitting ? "animate-spin" : ""} />
                    Resend OTP
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="name@example.com"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </motion.div>
              </>
            )}

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <RefreshCw size={20} className="animate-spin" />}
              {isSubmitting 
                ? (requiresVerification ? "Verifying..." : "Creating Account...") 
                : (requiresVerification ? "Verify Email" : "Create Account")}
            </motion.button>
          </form>

          <motion.p variants={itemVariants} className="mt-10 text-center text-slate-500 dark:text-slate-400 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
        <Icon size={20} />
      </div>
      <span className="font-semibold text-indigo-50">{text}</span>
    </div>
  );
}
