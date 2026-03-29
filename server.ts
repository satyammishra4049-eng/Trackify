import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Nodemailer Transporter Setup
// In a real app, use environment variables for these
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "test@example.com",
    pass: process.env.SMTP_PASS || "password",
  },
});

// Database Initialization
const db = new Database("finance.db");
db.pragma("journal_mode = WAL");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, month),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Ensure avatar_url column exists (for existing databases)
try {
  db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
} catch (e) {
  // Column likely already exists
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  const lowerEmail = email.toLowerCase();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    const info = stmt.run(name, lowerEmail, hashedPassword);
    const token = jwt.sign({ id: info.lastInsertRowid, email: lowerEmail, name }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, name, email: lowerEmail, avatarUrl: null } });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const lowerEmail = email.toLowerCase();
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(lowerEmail);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatar_url } });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const lowerEmail = email.toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(lowerEmail);
  
  if (!user) {
    // For security, don't reveal if user exists in production
    if (process.env.NODE_ENV === 'production') {
      return res.json({ success: true, message: "If an account exists with that email, an OTP has been sent." });
    } else {
      return res.status(400).json({ error: "User not found. Please register first." });
    }
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // Store OTP
  db.prepare("DELETE FROM otps WHERE email = ?").run(lowerEmail); // Clear old OTPs
  db.prepare("INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)").run(lowerEmail, otp, expiresAt);

  // Send Email
  try {
    const mailOptions = {
      from: '"Trackify Auth" <auth@trackify.com>',
      to: lowerEmail,
      subject: "Your Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Trackify</h2>
          <p>You requested a password reset. Use the following OTP to verify your identity:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">This OTP will expire in 5 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    console.log(`[OTP SENT] To: ${lowerEmail}, OTP: ${otp}`);
    
    transporter.sendMail(mailOptions).catch(err => {
      console.error("Nodemailer Error (expected if no real SMTP):", err.message);
    });

    // In demo mode, we include the OTP in the response for easier testing
    res.json({ 
      success: true, 
      message: "OTP sent successfully.",
      demoCode: process.env.NODE_ENV !== 'production' ? otp : undefined 
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const lowerEmail = email.toLowerCase();
  const storedOtp: any = db.prepare("SELECT * FROM otps WHERE email = ?").get(lowerEmail);

  if (!storedOtp) {
    console.log(`[OTP VERIFY FAILED] No OTP found for: ${lowerEmail}`);
    return res.status(400).json({ error: "No OTP found for this email." });
  }

  if (new Date(storedOtp.expires_at) < new Date()) {
    console.log(`[OTP VERIFY FAILED] OTP expired for: ${lowerEmail}`);
    return res.status(400).json({ error: "OTP has expired." });
  }

  if (storedOtp.attempts >= 5) {
    console.log(`[OTP VERIFY FAILED] Too many attempts for: ${lowerEmail}`);
    return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
  }

  if (storedOtp.otp !== otp) {
    console.log(`[OTP VERIFY FAILED] Invalid OTP for: ${lowerEmail}. Expected: ${storedOtp.otp}, Got: ${otp}`);
    db.prepare("UPDATE otps SET attempts = attempts + 1 WHERE email = ?").run(lowerEmail);
    return res.status(400).json({ error: "Invalid OTP." });
  }

  console.log(`[OTP VERIFIED] For: ${lowerEmail}`);
  res.json({ success: true, message: "OTP verified successfully." });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const lowerEmail = email.toLowerCase();
  
  // Verify OTP one last time
  const storedOtp: any = db.prepare("SELECT * FROM otps WHERE email = ?").get(lowerEmail);
  if (!storedOtp || storedOtp.otp !== otp || new Date(storedOtp.expires_at) < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPassword, lowerEmail);
    db.prepare("DELETE FROM otps WHERE email = ?").run(lowerEmail); // Clear OTP after use
    res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// --- Profile Routes ---
app.put("/api/user/profile", authenticateToken, (req: any, res) => {
  const { name, email, avatarUrl } = req.body;
  try {
    const stmt = db.prepare("UPDATE users SET name = ?, email = ?, avatar_url = ? WHERE id = ?");
    stmt.run(name, email, avatarUrl, req.user.id);
    res.json({ success: true, user: { id: req.user.id, name, email, avatarUrl } });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/user/password", authenticateToken, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: "Invalid current password" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/user/export", authenticateToken, (req: any, res) => {
  try {
    const user = db.prepare("SELECT name, email, created_at FROM users WHERE id = ?").get(req.user.id);
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ?").all(req.user.id);
    const budgets = db.prepare("SELECT * FROM budgets WHERE user_id = ?").all(req.user.id);
    
    const exportData = {
      user,
      transactions,
      budgets,
      exportedAt: new Date().toISOString()
    };
    
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Transaction Routes ---
app.get("/api/transactions", authenticateToken, (req: any, res) => {
  const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC").all(req.user.id);
  res.json(transactions);
});

app.post("/api/transactions", authenticateToken, (req: any, res) => {
  const { amount, type, category, date, description } = req.body;
  const stmt = db.prepare("INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)");
  const info = stmt.run(req.user.id, amount, type, category, date, description);
  res.json({ id: info.lastInsertRowid, ...req.body });
});

app.delete("/api/transactions/:id", authenticateToken, (req: any, res) => {
  const stmt = db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
  stmt.run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.put("/api/transactions/:id", authenticateToken, (req: any, res) => {
  const { amount, type, category, date, description } = req.body;
  const stmt = db.prepare("UPDATE transactions SET amount = ?, type = ?, category = ?, date = ?, description = ? WHERE id = ? AND user_id = ?");
  stmt.run(amount, type, category, date, description, req.params.id, req.user.id);
  res.json({ success: true });
});

// --- Budget Routes ---
app.get("/api/budgets", authenticateToken, (req: any, res) => {
  const budgets = db.prepare("SELECT * FROM budgets WHERE user_id = ?").all(req.user.id);
  res.json(budgets);
});

app.post("/api/budgets", authenticateToken, (req: any, res) => {
  const { category, amount, month } = req.body;
  const stmt = db.prepare("INSERT OR REPLACE INTO budgets (user_id, category, amount, month) VALUES (?, ?, ?, ?)");
  stmt.run(req.user.id, category, amount, month);
  res.json({ success: true });
});

app.delete("/api/budgets/:id", authenticateToken, (req: any, res) => {
  const stmt = db.prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?");
  stmt.run(req.params.id, req.user.id);
  res.json({ success: true });
});

// --- AI Insights Route ---
app.get("/api/ai/insights", authenticateToken, async (req: any, res) => {
  try {
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 50").all(req.user.id);
    const budgets = db.prepare("SELECT * FROM budgets WHERE user_id = ?").all(req.user.id);

    if (transactions.length === 0) {
      return res.json({ insights: "Add some transactions to get AI-powered financial insights!" });
    }

    const prompt = `
      Analyze the following financial data for a user and provide 3-4 concise, actionable insights or tips.
      Transactions (last 50): ${JSON.stringify(transactions)}
      Budgets: ${JSON.stringify(budgets)}
      
      Focus on:
      1. Spending patterns (e.g., "You spend a lot on Food").
      2. Budget alerts (e.g., "You are close to your limit in Travel").
      3. Savings tips.
      4. Unusual activity.
      
      Keep it friendly and professional. Format as a simple markdown list.
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({ insights: response.text });
  } catch (err) {
    console.error("AI Insight Error:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
