import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import app from '../server/app.js';

let isConnecting = false;
let isReady = false;

async function connectDB() {
  if (isReady) return true;
  
  if (isConnecting) {
    // Wait for connection to complete
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return isReady;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI missing');
  }

  isConnecting = true;
  
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[API] Connecting to database...');
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        autoIndex: true,
      });
      console.log('[API] Database connected successfully');
    }
    isReady = true;
    return true;
  } catch (error) {
    console.error('[API] Database connection failed:', error);
    isReady = false;
    throw error;
  } finally {
    isConnecting = false;
  }
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error: any) {
    console.error('[API] SERVER ERROR:', error);
    return res.status(500).json({
      message: 'Database connection failed',
      error: error?.message || 'Unknown error',
      retry: true
    });
  }
}
