import nodemailer from 'nodemailer';

// -------------------------------------------------------
// EMAIL SERVICE - BULLETPROOF IMPLEMENTATION
// Recreates transporters on each send to avoid race conditions
// -------------------------------------------------------

interface SendResult {
  success: boolean;
  messageId?: string;
  provider?: 'gmail' | 'mailtrap';
  error?: string;
}

// -------------------------------------------------------
// Get Fresh Environment Variables (call every time)
// -------------------------------------------------------
const getEmailConfig = () => ({
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  MAILTRAP_USER: process.env.MAILTRAP_USER,
  MAILTRAP_PASS: process.env.MAILTRAP_PASS,
});

// -------------------------------------------------------
// Debug: Log ENV status
// -------------------------------------------------------
export const logEmailEnvStatus = () => {
  const config = getEmailConfig();
  console.log('[Email] 🔍 Environment Variables Check:');
  console.log('  - EMAIL_USER:', config.EMAIL_USER ? `✅ ${config.EMAIL_USER}` : '❌ MISSING');
  console.log('  - EMAIL_PASS:', config.EMAIL_PASS ? `✅ Set (${config.EMAIL_PASS.length} chars)` : '❌ MISSING');
  console.log('  - MAILTRAP_USER:', config.MAILTRAP_USER ? '✅ Set' : '❌ Not configured (optional)');
  console.log('  - MAILTRAP_PASS:', config.MAILTRAP_PASS ? '✅ Set' : '❌ Not configured (optional)');
  return config;
};

// -------------------------------------------------------
// Validate ENV Variables
// -------------------------------------------------------
export const validateEmailEnv = (): { valid: boolean; error?: string } => {
  const { EMAIL_USER, EMAIL_PASS } = getEmailConfig();
  
  if (!EMAIL_USER) {
    return {
      valid: false,
      error: 'EMAIL_USER is not set in .env file'
    };
  }
  
  if (!EMAIL_PASS) {
    return {
      valid: false,
      error: 'EMAIL_PASS is not set in .env file'
    };
  }
  
  if (EMAIL_PASS.length !== 16) {
    console.warn('[Email] ⚠️ EMAIL_PASS should be 16 characters (Gmail App Password)');
  }
  
  return { valid: true };
};

// -------------------------------------------------------
// Create Fresh Gmail Transporter (called on each send)
// -------------------------------------------------------
const createGmailTransporter = () => {
  const { EMAIL_USER, EMAIL_PASS } = getEmailConfig();
  
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('[Email] ❌ Cannot create Gmail transporter: missing credentials');
    return null;
  }

  console.log(`[Email] 🔧 Creating Gmail transporter for: ${EMAIL_USER}`);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      pool: false, // Disable pooling for reliability
    });

    return transporter;
  } catch (error: any) {
    console.error('[Email] ❌ Failed to create Gmail transporter:', error.message);
    return null;
  }
};

// -------------------------------------------------------
// Create Fresh Mailtrap Transporter (called on each send)
// -------------------------------------------------------
const createMailtrapTransporter = () => {
  const { MAILTRAP_USER, MAILTRAP_PASS } = getEmailConfig();
  
  if (!MAILTRAP_USER || !MAILTRAP_PASS) {
    return null;
  }

  console.log('[Email] 🔧 Creating Mailtrap transporter');

  try {
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASS,
      },
    });

    return transporter;
  } catch (error: any) {
    console.error('[Email] ❌ Failed to create Mailtrap transporter:', error.message);
    return null;
  }
};

// -------------------------------------------------------
// Verify Configuration at Startup
// -------------------------------------------------------
export const verifyEmailConfig = async (): Promise<boolean> => {
  console.log('[Email] 🔍 Verifying email configuration...');
  
  const config = logEmailEnvStatus();
  
  if (!config.EMAIL_USER || !config.EMAIL_PASS) {
    console.error('[Email] ❌ Email configuration incomplete');
    console.error('[Email] 💡 Get Gmail App Password from: https://myaccount.google.com/apppasswords');
    return false;
  }

  // Test Gmail
  const gmailTransporter = createGmailTransporter();
  if (gmailTransporter) {
    try {
      await gmailTransporter.verify();
      console.log('[Email] ✅ Gmail SMTP verified successfully');
      return true;
    } catch (error: any) {
      console.error('[Email] ❌ Gmail verification failed:', error.message);
      console.error('[Email] 💡 Common fixes:');
      console.error('   1. Use Gmail App Password (16 chars), not your regular password');
      console.error('   2. Enable 2FA on your Google account first');
      console.error('   3. Generate App Password at https://myaccount.google.com/apppasswords');
    }
  }

  // Test Mailtrap fallback
  const mailtrapTransporter = createMailtrapTransporter();
  if (mailtrapTransporter) {
    try {
      await mailtrapTransporter.verify();
      console.log('[Email] ✅ Mailtrap fallback verified');
      return true;
    } catch (error: any) {
      console.error('[Email] ❌ Mailtrap verification failed:', error.message);
    }
  }

  console.error('[Email] ❌ No working email provider found');
  return false;
};

// -------------------------------------------------------
// Send Email with Retry + Fresh Transporters
// CRITICAL: Creates new transporter on each attempt to avoid race conditions
// -------------------------------------------------------
const sendWithRetry = async (
  mailOptions: nodemailer.SendMailOptions,
  maxRetries: number = 3
): Promise<SendResult> => {
  const config = getEmailConfig();
  
  if (!config.EMAIL_USER || !config.EMAIL_PASS) {
    return { success: false, error: 'Email credentials not configured' };
  }

  let lastError: any;
  
  // Try Gmail first
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Email] 📤 Gmail attempt ${attempt}/${maxRetries}...`);
      
      // CRITICAL: Create fresh transporter on each attempt
      const transporter = createGmailTransporter();
      if (!transporter) {
        throw new Error('Failed to create Gmail transporter');
      }

      const result = await transporter.sendMail(mailOptions);
      console.log(`[Email] ✅ Email sent via Gmail: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        provider: 'gmail'
      };
    } catch (error: any) {
      lastError = error;
      console.error(`[Email] ❌ Gmail attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000;
        console.log(`[Email] ⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Try Mailtrap fallback
  if (config.MAILTRAP_USER && config.MAILTRAP_PASS) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Email] 📤 Mailtrap fallback attempt ${attempt}/${maxRetries}...`);
        
        const transporter = createMailtrapTransporter();
        if (!transporter) {
          throw new Error('Failed to create Mailtrap transporter');
        }

        const result = await transporter.sendMail(mailOptions);
        console.log(`[Email] ✅ Email sent via Mailtrap: ${result.messageId}`);
        
        return {
          success: true,
          messageId: result.messageId,
          provider: 'mailtrap'
        };
      } catch (error: any) {
        lastError = error;
        console.error(`[Email] ❌ Mailtrap attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = attempt * 1000;
          console.log(`[Email] ⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'All email providers failed'
  };
};

// -------------------------------------------------------
// Send Test Email
// -------------------------------------------------------
export const sendTestEmail = async (): Promise<SendResult> => {
  const config = getEmailConfig();
  
  console.log('[Email] 🧪 Sending test email...');
  console.log('[Email] 📧 From:', config.EMAIL_USER);
  console.log('[Email] 📧 To:', config.EMAIL_USER);

  if (!config.EMAIL_USER || !config.EMAIL_PASS) {
    return { 
      success: false, 
      error: 'EMAIL_USER and EMAIL_PASS must be set in .env file' 
    };
  }

  const testMailOptions = {
    from: {
      name: 'Trackify Test',
      address: config.EMAIL_USER,
    },
    to: config.EMAIL_USER,
    subject: 'Trackify - Test Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .success { color: #22c55e; font-size: 24px; font-weight: bold; }
          .info { color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✅ Test Email Successful!</h1>
          <p class="info">
            <strong>Time:</strong> ${new Date().toLocaleString()}<br>
            <strong>App:</strong> Trackify
          </p>
          <p>Your email configuration is working correctly!</p>
        </div>
      </body>
      </html>
    `,
    text: `Test Email Successful!\n\nTime: ${new Date().toLocaleString()}\nApp: Trackify`,
  };

  return await sendWithRetry(testMailOptions, 3);
};

// -------------------------------------------------------
// Send OTP Email
// -------------------------------------------------------
export const sendOTPEmail = async (
  to: string,
  otp: string,
  purpose: 'forgot-password' | 'email-verification' = 'forgot-password'
): Promise<boolean> => {
  const config = getEmailConfig();
  
  console.log(`[Email] 📧 Sending OTP email to: ${to}`);
  console.log(`[Email] 🔑 OTP: ${otp} (Purpose: ${purpose})`);

  if (!config.EMAIL_USER || !config.EMAIL_PASS) {
    console.error('[Email] ❌ Cannot send OTP: EMAIL_USER or EMAIL_PASS not set');
    return false;
  }

  const subject = purpose === 'email-verification'
    ? 'Trackify - Verify Your Email'
    : 'Trackify - Password Reset OTP';

  const title = purpose === 'email-verification'
    ? 'Email Verification'
    : 'Password Reset';

  const message = purpose === 'email-verification'
    ? 'Thank you for signing up with Trackify. Please use the OTP below to verify your email address.'
    : 'You requested a password reset for your Trackify account. Please use the OTP below to reset your password.';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #4f46e5;
          font-size: 28px;
          margin: 0;
          font-weight: 700;
        }
        .title {
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
        }
        .message {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
          text-align: center;
        }
        .otp-container {
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin-bottom: 30px;
          border: 2px solid #4f46e5;
        }
        .otp-code {
          color: #4f46e5;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          margin: 0;
          font-family: 'Courier New', monospace;
        }
        .expiry {
          color: #9ca3af;
          font-size: 14px;
          margin-top: 10px;
        }
        .footer {
          color: #9ca3af;
          font-size: 12px;
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .warning {
          color: #ef4444;
          font-size: 12px;
          text-align: center;
          margin-top: 15px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>Trackify</h1>
        </div>
        <h2 class="title">${title}</h2>
        <p class="message">${message}</p>
        <div class="otp-container">
          <p class="otp-code">${otp}</p>
          <p class="expiry">This OTP expires in 10 minutes</p>
        </div>
        <p class="warning">Do not share this code with anyone.</p>
        <div class="footer">
          <p>© 2026 Trackify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `${title}

${message}

Your OTP is: ${otp}

This OTP expires in 10 minutes.

Do not share this code with anyone.

© 2026 Trackify`;

  const mailOptions = {
    from: {
      name: 'Trackify',
      address: config.EMAIL_USER,
    },
    to,
    subject,
    html: htmlContent,
    text: textContent,
  };

  const result = await sendWithRetry(mailOptions, 3);

  if (!result.success) {
    console.error('[Email] ❌ Failed to send OTP email:', result.error);
    return false;
  }

  console.log(`[Email] ✅ OTP email sent successfully via ${result.provider}`);
  return true;
};

// -------------------------------------------------------
// Send Welcome Email
// -------------------------------------------------------
export const sendWelcomeEmail = async (to: string, name: string): Promise<boolean> => {
  const config = getEmailConfig();
  
  console.log(`[Email] 📧 Sending welcome email to: ${to}`);

  if (!config.EMAIL_USER || !config.EMAIL_PASS) {
    console.error('[Email] ❌ Cannot send welcome email: credentials not set');
    return false;
  }

  const subject = 'Welcome to Trackify!';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          padding: 40px;
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #4f46e5;
          font-size: 28px;
          margin: 0;
        }
        .title {
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 20px;
        }
        .message {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          text-align: center;
          margin-bottom: 30px;
        }
        .button-container {
          text-align: center;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
        }
        .footer {
          color: #9ca3af;
          font-size: 12px;
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>Trackify</h1>
        </div>
        <h2 class="title">Welcome, ${name}!</h2>
        <p class="message">
          Thank you for joining Trackify! Your email has been verified successfully.
          You can now start tracking your finances and achieving your financial goals.
        </p>
        <div class="button-container">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5002'}" class="button">Go to Dashboard</a>
        </div>
        <div class="footer">
          <p>© 2026 Trackify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Welcome to Trackify, ${name}!\n\nThank you for joining Trackify! Your email has been verified successfully.\n\n© 2026 Trackify`;

  const mailOptions = {
    from: {
      name: 'Trackify',
      address: config.EMAIL_USER,
    },
    to,
    subject,
    html: htmlContent,
    text: textContent,
  };

  const result = await sendWithRetry(mailOptions, 3);

  if (!result.success) {
    console.error('[Email] ❌ Failed to send welcome email:', result.error);
    return false;
  }

  console.log(`[Email] ✅ Welcome email sent via ${result.provider}`);
  return true;
};

export default { sendOTPEmail, sendWelcomeEmail, sendTestEmail, verifyEmailConfig, validateEmailEnv, logEmailEnvStatus };
