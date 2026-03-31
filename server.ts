import dotenv from 'dotenv';

// Load .env FIRST before ANY other code runs
dotenv.config();

// CRITICAL: Validate ENV immediately after dotenv loads
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║           ENVIRONMENT VARIABLE CHECK                     ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log(`EMAIL_USER: ${EMAIL_USER ? '✅ LOADED (' + EMAIL_USER + ')' : '❌ MISSING'}`);
console.log(`EMAIL_PASS: ${EMAIL_PASS ? '✅ LOADED (' + EMAIL_PASS.length + ' chars)' : '❌ MISSING'}`);

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════╗');
  console.error('║           CRITICAL ERROR: Missing .env file              ║');
  console.error('╚══════════════════════════════════════════════════════════╝');
  console.error('1. Create file: .env (in root folder, same level as server.ts)');
  console.error('2. Add these lines:');
  console.error('   EMAIL_USER=your-email@gmail.com');
  console.error('   EMAIL_PASS=your-16-char-app-password');
  console.error('3. Get Gmail App Password: https://myaccount.google.com/apppasswords');
  console.error('');
  throw new Error('EMAIL_USER and EMAIL_PASS must be set in .env file');
}

console.log('');
console.log('✅ Environment variables loaded successfully!');
console.log('');

// Now safe to import other modules (after dotenv loaded)
import { connectDB } from './server/config/db.ts';
import app from './server/app.ts';

const DEFAULT_PORT = 5001;
const rawPort = Number(process.env.PORT);
const PORT = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : DEFAULT_PORT;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const startServer = async (): Promise<void> => {
  // Dynamic import email service AFTER dotenv is loaded
  const { verifyEmailConfig } = await import('./server/services/emailService.ts');
  
  // Verify email configuration on startup
  const emailReady = await verifyEmailConfig();
  if (!emailReady) {
    console.warn('[Server] ⚠️ Email service not configured - emails will fail');
  }

  const listen = (port: number) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[Server] Running on http://localhost:${port}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${port} busy. Trying ${port + 1}...`);
        listen(port + 1);
        return;
      }
      console.error('[Server] Listen error:', error);
    });
  };

  listen(PORT);

  // Connect DB in background
  (async () => {
    let retries = 0;
    while (true) {
      try {
        await connectDB();
        console.log('[Server] DB is connected.');
        return;
      } catch (error) {
        retries += 1;
        console.error(`[Server] DB connection failed (attempt ${retries}). Retrying in 5s...`);
        await delay(5000);
      }
    }
  })();
};

startServer().catch((error: unknown) => {
  console.error('[Server] Startup failed:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
  process.exit(1);
});
