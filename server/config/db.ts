import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const rawUri = process.env.MONGO_URI;
  if (!rawUri) {
    throw new Error('MONGO_URI is missing in .env');
  }

  const normalizedUri = rawUri.trim().replace(/^['"]|['"]$/g, '');
  if (!/^mongodb:\/\//i.test(normalizedUri)) {
    throw new Error('MONGO_URI must use mongodb:// (non-SRV URI)');
  }

  mongoose.set('strictQuery', true);
  const maskedUri = normalizedUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  console.log(`[DB] Connecting: ${maskedUri}`);

  try {
    await mongoose.connect(normalizedUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      autoIndex: true,
    });
    console.log(`[DB] MongoDB Connected: ${mongoose.connection.name}@${mongoose.connection.host}`);
  } catch (error: any) {
    console.error('[DB] Connection error:', error?.message || error);
    throw error;
  }
};
