import mongoose, { Document, Schema } from 'mongoose';

// FIX: Added proper TypeScript interface for strong typing
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // FIX: Automatically lowercases before saving — no need to call .toLowerCase() in controllers
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false, // Don't return OTP in queries by default
    },
    otpExpiry: {
      type: Date,
      select: false, // Don't return expiry in queries by default
    },
  },
  {
    timestamps: true,
    toJSON: {
      // FIX: Properly typed transform to avoid lint errors
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password; // SECURITY: Never expose password hash
        delete ret.otp; // SECURITY: Never expose OTP
        delete ret.otpExpiry; // SECURITY: Never expose OTP expiry
        return ret;
      },
    },
  }
);

const User = mongoose.model<IUser>('User', userSchema);
export default User;
