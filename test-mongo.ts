import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    console.log('Uri:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
