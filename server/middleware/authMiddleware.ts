import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'trackifySecretKey123';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // FIX: Check token BEFORE trying to verify, and return early if missing
  if (!token) {
    res.status(401).json({ error: 'Not authorized — no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // FIX: Check if user still exists in DB (handles deleted accounts)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({ error: 'Not authorized — user no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Not authorized — token has expired, please login again' });
    } else {
      res.status(401).json({ error: 'Not authorized — invalid token' });
    }
  }
};
