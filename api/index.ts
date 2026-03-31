import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

dotenv.config();

// Import the Express app
import app from './server/app.ts';

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Connect to DB on first request
  const { connectDB } = await import('./server/config/db.ts');
  await connectDB();
  
  // Handle the request through Express
  return app(req, res);
}
