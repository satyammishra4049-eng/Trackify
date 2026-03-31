import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import app from '../app.js';

let isReady = false;

async function connectDB() {
  if (isReady) return;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI missing');
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB Connected');
  }

  isReady = true;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error: any) {
    console.error('SERVER ERROR:', error);
    return res.status(500).json({
      message: 'Server failed',
      error: error?.message || 'Unknown error',
    });
  }
}
